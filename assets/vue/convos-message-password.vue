<template>
  <div class="convos-message error">
    <a href="#chat" class="title">convosbot</a>
    <form @submit.prevent="join" class="message">
      <p>
        This dialog is password protected. Please enter a valid password to join.
      </p>
      <div class="row">
        <md-input :value.sync="password" cols="s7 m8">Password</md-input>
        <div class="col s5 m3 input-field">
          <button class="btn waves-effect waves-light" :disabled="!password.length">Chat</button>
        </div>
      </div>
    </form>
  </div>
</template>
<script>
module.exports = {
  props: ["dialog", "msg", "user"],
  data: function() {
    return {password: ""};
  },
  methods: {
    join: function() {
      if (!this.password.length) return;
      this.dialog.connection().send("/join " + this.dialog.name + " " + this.password);
    }
  }
};
</script>
