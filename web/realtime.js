var r = require('rethinkdb');
var connection = null;
r.connect( {host: 'rethinkdb', port: 28015}, function(err, conn) {
    if (err) throw err;
    connection = conn;
})

var onConnection = function(socket) {
  r.db('livemvd').table('cutcsa_locations').changes().run(connection, function(err, cursor) {
    if (cursor) {
      cursor.each(function(_, data) {
        socket.emit('bus', data.new_val);
      })
    }
  });
}

module.exports = {
  onConnection: onConnection
}
