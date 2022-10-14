let io;

module.exports = {
    initIo:(server)=>{
        io = require('socket.io')(server);
        console.log('io connecteddddddddddd')
        return io
    },
    getIo:()=>{
        if(!io){
            throw new Error("socket io error")
        }
        return io
    }
}