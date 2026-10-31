import { schema, table, t } from 'spacetimedb/server';

const user = table(
    { name: 'user', public: true},
    { 
        identity: t.identity().primaryKey(),
        name: t.string(),
        lat: t.f64(),
        lng: t.f64(),
        online: t.bool()
    }
)

const spacetimedb = schema({user});


export default spacetimedb;

export const onConnect = spacetimedb.clientConnected(_ctx => {
    // Called every time a new client connects
    console.log("User connected")
    const me = _ctx.db.user.identity.find(_ctx.sender)

    if (me){
        _ctx.db.user.identity.update({...me, online: true})
    } else {
        _ctx.db.user.insert({
            identity: _ctx.sender,
            name: "",
            lat: 44.650853, 
            lng: -63.592444,
            online: true
        })
    }
});

export const onDisconnect = spacetimedb.clientDisconnected(_ctx => {
    // Called every time a client disconnects
    const me = _ctx.db.user.identity.find(_ctx.sender)
    if (me){
        _ctx.db.user.identity.update({...me, online: false})
    } 
});

export const setName = spacetimedb.reducer(
    { name: t.string() },
    (_ctx, { name }) => {
        const me = _ctx.db.user.identity.find(_ctx.sender)
        if (me) {
            _ctx.db.user.identity.update({...me, name })
        }
    }
);

export const updateLocation = spacetimedb.reducer(
    { lat: t.f64(), lng: t.f64() },
    (_ctx, { lat, lng }) => {
        const me = _ctx.db.user.identity.find(_ctx.sender)
        if (me) {
            _ctx.db.user.identity.update({...me, lat, lng })
        }
    }
);