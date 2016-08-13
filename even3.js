"use strict";
//TODO: reject by Object.defineProperty() events external reset
//TODO: циклические ссылки в цепях
//TODO: multi-item Even3 optimization
function Even3(item){
    item.onmousemove = item.onmouseup = item.onmousedown = item.onwait = function(e){
        e = e || window.event || {}; msg.even3 = msg.even3 || e;
        e.preventDefault && e.preventDefault(); //для отмены действий поумолчанию
        msg.now = e.timeStamp || (window.performance && window.performance.now()); msg.time = msg.time || msg.now; //дублируем метку времени
        msg.dT = (msg.now - msg.even3.timeStamp) || 0;
        msg.dX = (e.pageX - msg.even3.pageX) || 0; msg.dx = (e.pageX - msg.x) || 0;
        msg.dY = (e.pageY - msg.even3.pageY) || 0; msg.dy = (e.pageY - msg.y) || 0;
        while(true){
            msg.dt = (msg.now - msg.time) || 0;
            for(var buf = [], key, obj, n = 1; obj = state[n] && state[n][0]; n++)
                if('wait' == (key = Object.keys(obj)[0])){
                    var newmsg = obj[key](e, msg);
                    if(newmsg === true) continue;
                    if(newmsg === false || newmsg === undefined) {state = item.even3; break;} //событие обрывает цепочку
                    if(newmsg >= 0) continue;
                    buf.push({delay: newmsg - Math.random(), state: state[n]});
                }
            if(!buf.length) break;
            var erlyest = buf.reduce(function(a, b){return (a.delay < b.delay) ? a : b});
            state = erlyest.state;
            msg.time += erlyest.delay; //|| msg.now; 
            if(state.length <= 1) state = item.even3; //тупиковая цепочка, возвращаем состояние на корень Even3
        }
        if(state.length <= 1) state = item.even3; //тупиковая цепочка, возвращаем состояние на корень Even3
        
        for(var key, obj, n = 1; obj = state[n] && state[n][0]; n++)
            if(e.type == (key = Object.keys(obj)[0])){
                var newmsg = obj[key](e, msg);
                msg.time = msg.now; //дублируем метку времени события
                msg.x = e.pageX; msg.y = e.pageY;
                if(newmsg === true) continue; //событие ожидает других условий
                if(newmsg === false) return state = item.even3; //событие обрывает цепочку
                msg.even3 = e; //сохраняем информацию о выполненном событии
                //TODO: событие может вернуть объект newmsg... сделаем управляемый переход для граффовой структуры цепочек?
                return state = state[n];
            }
    }
    var msg = {}, state = item.even3 = [{root:function(){throw Error("impossible mistake: Can't run root node")}}];
    return function(){ for(var n = 0; n < arguments.length; n++) item.even3.push(arguments[n]); };
}