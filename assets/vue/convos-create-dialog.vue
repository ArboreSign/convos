<template>
  <form autocomplete="off" class="convos-create-dialog" @submit.prevent>
    <div class="row">
      <div class="col s12">
        <h4>Join dialog</h4>
        <p>
          You can create a dialog with either a single user (by nick)
          or join a chat room (channel). Click "<a href="#load/rooms" @click.prevent="loadRooms">Load</a>"
          to get a list of available rooms. Note that loading the list
          from the server might take a while.
        </p>
      </div>
    </div>
    <div class="row" v-if="this.user.connections.length > 1">
      <md-select :value.sync="connectionId" label="Select connection">
        <md-option :value="c.connection_id" :selected="connectionId == c.connection_id" v-for="c in user.connections">{{c.protocol}}-{{c.name}}</md-option>
      </md-select>
    </div>
    <div class="row">
      <md-input :value.sync="dialogName" cols="s7 m8">Room or nick name</md-input>
      <div class="col s5 m3 input-field">
        <button @click="join" class="btn waves-effect waves-light" :disabled="!dialogName.length">Chat</button>
      </div>
    </div>
    <div class="row" v-if="errors.length">
      <div class="col s12"><div class="alert">{{errors[0].message}}</div></div>
    </div>
    <div class="row" v-if="filteredRooms.length">
      <div class="col s7 m8 rooms">
        <div class="collection">
          <a :href="'#chat/' + connectionId + '/' + r.name" @click.prevent="join" class="collection-item" :class="activeClass(r, i)" v-for="(i, r) in filteredRooms"><span class="secondary-content">({{r.n_users}})</span>{{r.name}} - {{r.topic || "No topic"}}</a></li>
        </div>
        <p>Total: {{rooms.length}} (<a href="#clear" @click.prevent="rooms = []">clear</a>)</p>
      </div>
    </div>
  </form>
</template>
<script>
module.exports = {
  props: ["user"],
  data: function() {
    return {
      connectionId: this.user.connections[0].connection_id,
      dialogName: Convos.settings.main.split("/")[1] || "",
      errors: [],
      rooms: []
    };
  },
  computed: {
    filteredRooms: function() {
      var re = new RegExp("\\b" + this.dialogName, "i");
      return this.rooms.filter(function(r) {
        return (r.name + r.title).match(re);
      }).slice(0, 100);
    }
  },
  watch: {
    "connectionId": function(v, o) { this.errors = []; this.rooms = []; },
    "settings.main": function(v, o) { this.dialogName = v.split("/")[1] || ""; }
  },
  methods: {
    activeClass: function(r, i) {
      return this.dialogName && i == 0 ? "active" : "";
    },
    connection: function() {
      return this.user.getConnection(this.connectionId);
    },
    join: function(e) {
      if (e.target && e.target.href) {
        this.dialogName = e.target.href.replace(/.*chat\/([^/]+)\//, '');
      }
      else if(this.filteredRooms.length) {
        this.dialogName = this.filteredRooms[0].name;
      }

      if (this.dialogName) this.connection().send("/join " + this.dialogName);
      this.dialogName = "";
    },
    loadRooms: function(e) {
      var self = this;
      this.dialogName = "";
      this.errors = [];
      this.connection().rooms(function(err, rooms) {
        if (err) return self.errors = err;
        var s = rooms.length == 1 ? "" : "s";
        self.dialogName = "";
        self.rooms = rooms.map(function(r) {
          if (!r.topic) r.topic = "No topic";
          return {name: r.name, n_users: r.n_users, title: r.topic};
        }).sort(function(a, b) {
          return b.n_users - a.n_users || a.name.localeCompare(b.name);
        });
      });
    }
  }
};
</script>
