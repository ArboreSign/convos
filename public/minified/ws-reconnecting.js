window.ws=function(h){function i(c){l=new WebSocket(h);if(g.debug){console.debug("ReconnectingWebSocket","attempt-connect",h)}var b=l;var a=setTimeout(function(){if(g.debug){console.debug("ReconnectingWebSocket","connection-timeout",h)}j=true;b.close();j=false},g.timeoutInterval);l.onopen=function(d){clearTimeout(a);if(g.debug){console.debug("ReconnectingWebSocket","onopen",h)}g.readyState=WebSocket.OPEN;c=false;g.onopen(d);while(g.buffer.length){g.send(g.buffer.shift())}};l.onclose=function(d){clearTimeout(a);l=null;if(k){g.readyState=WebSocket.CLOSED;g.onclose(d,false)}else{g.readyState=WebSocket.CONNECTING;if(!c&&!j){if(g.debug){console.debug("ReconnectingWebSocket","onclose",h)}g.onclose(d,true)}setTimeout(function(){i(true)},g.reconnectInterval)}};l.onmessage=function(d){if(g.debug){console.debug("ReconnectingWebSocket","onmessage",h,d.data)}g.onmessage(d)};l.onerror=function(d){if(g.debug){console.debug("ReconnectingWebSocket","onerror",h,d)}g.onerror(d)}}var k=false;var j=false;var l;var g={buffer:[],debug:false,onerror:function(a){console.log(g.url+" !",a.type,l.readyState)},onopen:function(a){console.log(g.url+" : open")},onmessage:function(a){console.log(g.url+" <",a.data)},onclose:function(a){console.log(g.url+" : close")},reconnectInterval:2000,timeoutInterval:5000,readyState:WebSocket.CONNECTING,url:h,close:function(){if(!l){return false}l.close();return(k=true)},send:function(a){if(g.readyState==WebSocket.OPEN){l.send(a)}else{g.buffer.push(a)}return g}};i(h);return g};