package Convos::Core::Conversation::Direct;

=head1 NAME

Convos::Core::Conversation::Direct - A convos conversation between two persons

=head1 DESCRIPTION

L<Convos::Core::Conversation::Direct> is a class describing a L<Convos>
conversation between two persons.

=head1 SYNOPSIS

  use Convos::Core::Conversation::Direct;
  my $room = Convos::Core::Conversation::Direct->new;

=cut

use Mojo::Base 'Convos::Core::Conversation';

=head1 ATTRIBUTES

L<Convos::Core::Conversation::Direct> inherits all attributes from
L<Convos::Core::Conversation> and implements the following new ones.

=head1 METHODS

L<Convos::Core::Conversation::Direct> inherits all methods from
L<Convos::Core::Conversation> and implements the following new ones.

=head1 COPYRIGHT AND LICENSE

Copyright (C) 2014, Jan Henning Thorsen

This program is free software, you can redistribute it and/or modify it under
the terms of the Artistic License version 2.0.

=head1 AUTHOR

Jan Henning Thorsen - C<jhthorsen@cpan.org>

=cut

1;