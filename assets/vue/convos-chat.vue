<template>
  <div class="convos-chat">
    <convos-main-menu :user="user"></convos-main-menu>
    <convos-dialog-container :dialog="d" :user="user" v-show="d.active" v-for="d in user.dialogs"></convos-dialog-container>
    <convos-settings :error="error" :user="user" v-if="show == 'settings'"></convos-settings>
    <component :is="'convos-' + settings.sidebar" :user="user" v-if="settings.sidebar"></component>
  </div>
</template>
<script>
module.exports = {
  props: ["user"],
  data: function() {
    return {show: "", error: {}};
  },
  watch: {
    "settings.main": function(v, o) {
      this.calculateMainArea();
    }
  },
  methods: {
    calculateMainArea: function() {
      var main = Convos.settings.main;
      var validMain = false;
      var i;

      this.show = main.indexOf("#chat") == 0 ? "dialog" : "settings";
      this.error = {};

      for (i = 0; i < this.user.dialogs.length; i++) {
        var d = this.user.dialogs[i];
        d.active = d.href() == main ? true : false;
        if (d.active) validMain = true;
      }

      if (this.show == "dialog") {
        if (validMain) return;
        this.error = {message: "Could not find dialog " + main + "."};
      }
    }
  },
  ready: function() {
    this.calculateMainArea();
  }
};
</script>
