package Convos::Model::Role::File;

=head1 NAME

Convos::Model::Role::File - Role for storing object to file

=head1 DESCRIPTION

L<Convos::Model::Role::File> contains methods which is useful for objects
that want to be persisted to disk or store state to disk.

=head1 SYNOPSIS

  package Some::Awesome::Model;
  use Role::Tiny::With;
  with "Convos::Model::Role::File";

  # a list of accessors to persist to disk
  sub _setting_keys { qw( foo bar ) }

  # in which directory to store the file, relative to $CONVOS_SHARE_DIR
  sub _sub_dir { File::Spec->catdir("some", "dir");

  1;

=head1 ENVIRONMENT

=head2 CONVOS_SHARE_DIR

C<CONVOS_SHARE_DIR> can be set to specify where to save data from objects.
The default directory on *nix systems is something like this:

  $HOME/.local/share/convos/

C<$HOME> is figured out from L<File::HomeDir/my_home>.

=cut

use Mojo::Base -base;
use Mojo::Home;
use Mojo::JSON;
use Fcntl ':flock';
use File::Path ();
use File::Spec;
use Role::Tiny;
use constant DEBUG => $ENV{CONVOS_DEBUG} || 0;

requires qw( _setting_keys _sub_dir );

=head1 ATTRIBUTES

=head2 home

Holds a L<Mojo::Home> object which points to where the object can store data.

The location is made up by L</CONVOS_SHARE_DIR> and C<_sub_dir()>.
See L</SYNOPSIS> for more details.

=cut

has home => sub {
  my $self = shift;
  my $path = File::Spec->catdir($self->_share_dir, $self->_sub_dir);
  File::Path::make_path($path) unless -d $path;
  Mojo::Home->new($path);
};

around _compose_classes_with => sub { my $orig = shift; ($orig->(@_), __PACKAGE__) };

=head1 METHODS

=head2 load

  $self = $self->load(sub { my ($self, $err) = @_; });

Used to load settings from persistent storage. C<$err> is not set if
if C<$self> is not saved.

=cut

sub load {
  my ($self, $cb) = @_;
  my $storage_file = File::Spec->catfile($self->home, $self->_storage_file('json'));
  my $settings = {};

  $cb ||= sub { die $_[1] if $_[1] };

  if (-e $storage_file) {
    eval {
      $settings = Mojo::JSON::decode_json(Mojo::Util::slurp($storage_file));
      $self->{$_} = $settings->{$_} for grep { defined $settings->{$_} } $self->_setting_keys;
      1;
    } or do {
      $self->$cb($@);
      return $self;
    };
  }

  $self->$cb('');
  $self;
}

=head2 log

  $self->log($level => $message);

This is an around method modifier, which will log the given message
to disk. The current log format is:

  $rfc_3339_datetime [$level] $message\n

Note that the C<$rfc_3339_datetime> is created from C<gmtime>, and not
C<localtime>.

=cut

around log => sub {
  my ($next, $self, $level, $format, @args) = @_;
  my $message = @args ? sprintf $format, map { $_ // '' } @args : $format;
  my $fh = $self->_log_fh;

  flock $fh, LOCK_EX;
  printf {$fh} $self->_format_log_message($level, $message);
  flock $fh, LOCK_UN;

  return $self->$next($level => $message);
};

=head2 save

  $self = $self->load(sub { my ($self, $err) = @_; });

Used to save user settings to persistent storage.

=cut

sub save {
  my ($self, $cb) = @_;
  my $storage_file = File::Spec->catfile($self->home, $self->_storage_file('json'));

  $cb ||= sub { die $_[1] if $_[1] };

  eval {
    File::Path::make_path($self->home) unless -d $self->home;
    Mojo::Util::spurt(Mojo::JSON::encode_json({map { ($_, $self->{$_}) } $self->_setting_keys}), $storage_file);
    $self->$cb('');
    1;
  } or do {
    $self->$cb($@);
  };

  return $self;
}

sub _format_log_message {
  my ($self, $level, $message) = @_;
  my ($s, $m, $h, $day, $month, $year) = gmtime;
  sprintf "%04d-%02d-%02dT%02d:%02d:%02d [%s] %s\n", $year + 1900, $month + 1, $day, $h, $m, $s, $level, $message;
}

# TODO: Add global caching of filehandle so we can have a pool
# of filehandles. Maybe something like FileCache.pm?
sub _log_fh {
  my $self = shift;
  return $self->{_log_fh} if $self->{_log_fh};
  my $path = File::Spec->catfile($self->home, $self->_storage_file('log'));
  open my $fh, '>>', $path or die "Could not open log file $path: $!";
  $self->{_log_fh} = $fh;
}

# should probably be public
sub _share_dir {
  my $self = shift;
  my $path = $ENV{CONVOS_SHARE_DIR};

  unless ($path) {
    my $home = File::HomeDir->my_home
      || die 'Could not figure out CONVOS_SHARE_DIR. $HOME directory could not be found.';
    $path = File::Spec->catdir($home, qw( .local share convos ));
  }

  warn "[CONVOS] share_dir=$path\n" if DEBUG;
  Cwd::abs_path($path);
}

sub _storage_file {
  my ($class) = split /__WITH__/, ref $_[0];    # Convos::Model::User__WITH__Convos::Model::Role::File
  return sprintf '%s.%s', lc($1), $_[1] if $class =~ m!(\w+)\W*$!;
  die "Could not get _storage_file($_[1]) from $_[0]";
}

=head1 COPYRIGHT AND LICENSE

Copyright (C) 2014, Jan Henning Thorsen

This program is free software, you can redistribute it and/or modify it under
the terms of the Artistic License version 2.0.

=head1 AUTHOR

Jan Henning Thorsen - C<jhthorsen@cpan.org>

=cut

1;