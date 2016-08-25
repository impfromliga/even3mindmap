'use strict';
var MindMap = function (map, ids, px, angle, x0, y0) {
    //TODO: опцилональное автоскрытие одиночной цепи
    var lastId = 0;
    console.log('map', map);
    (function setParent(node, parent) {
        node[0].parent = parent || false;
        //if(!node[0].id) node[0].id = lastId++; //autoIncrementID
        console.log(node[0].cap, 'child of', parent && parent[0].cap || 'none');
        for (var n = node.length; --n;) setParent(node[n], node);
    })(map);
    
    var ctx = ids.canvas.getContext('2d');
    ctx.imageSmoothingEnabled=ctx.webkitImageSmoothingEnabled=ctx.mozImageSmoothingEnabled=ctx.oImageSmoothingEnabled=false;
    px = px || 20;
    angle = angle || Math.PI*2;
    x0 = x0 || ids.canvas.width / 2; y0 = y0 || ids.canvas.height /2
    ctx.translate(x0, y0);
    ids.node.onkeydown = function(e){ //изменение названия пункта
        if((e || window.event).keyCode^13)return;
        targets[0][0].cap = this.value;
        iddb.mov(targets[0]);
        ids.box.style.display = 'none';
        ctx.sel.one();
    }
    ids.child.onkeydown = function(e){ //добавление потомка
        if((e||window.event).keyCode^13)return;
        if(!this.value)return ctx.sel.one()||ctx.sel.opt(); //при пустом вводе отмена ввода
        var node = [{cap:this.value, parent:targets[0]}] //создание пункта
        iddb.add(node);
        targets[0].push( node );
        this.value='';
    }
    
    ctx.scroll = function(dx, dy){
        x0 += dx; y0 += dy; //var matrix = ctx.currentTransform //matrix.e matrix.f;
        //http://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/currentTransform
        ctx.translate(dx, dy);
    }
    ctx.pick = function(x, y, a, r, node, rotate, sector, radiusA){
        r = r || Math.hypot(y - y0, x - x0);
        radiusA = radiusA || 20; //TODO: const root offset
        node = node || map;
        if(r < 20) return map; //TODO: global mmap root path
        a = a || Math.atan2(y - y0, x - x0);
        rotate = rotate || (typeof node[0].a === 'number' ? node[0].a : Math.PI); //TODO: global mmap rotate;
        sector = sector || angle;
        var n = node.length - 1,
            step = sector / n,
            find = ((((a - rotate) % (Math.PI*2)) + Math.PI*2) % (Math.PI*2)) / step | 0;
        ctx.save();
        for(var m in node[0].default) ctx[m] = node[0].default[m]; //local styles
        var w = ctx.measureText(node[0].cap).width + margin*2,
            radA = Math.max(radiusA, parseInt(ctx.font.split(' ')[0].replace('px', '')) / Math.sin(Math.min(sector, Math.PI/3))) + w;
        if(node === map) radA = 20; //TODO: global root offset

        ctx.restore();
        if (radA > r) return node;
        if (node.length > 1) return ctx.pick(x, y, a, r, node[find+1], rotate + step * find, step, radA);
        return false;
    }
    
    ctx.textBaseline = 'middle';
    ctx.textAlign = "center";
    ctx.lineWidth = .5;
    var style = {default:{fillStyle: 'rgba(0,0,0,0)'}, select: {strokeStyle: '#6af', fillStyle: '#2f3437'}}
    var margin = px / 8;
    ctx.clear = function(){
        ctx.clearRect(-x0, -y0, cnv.width, cnv.height);
    }
    ctx.draw = function(node, a, da, r, lim){
        node = node || map;
        da = (da || node[0].da) || (Math.PI*2);
        r = r || node[0].r || 0;
        lim = lim || 9;
        if(typeof a === 'undefined') a = typeof node[0].a === 'number' ? node[0].a : Math.PI;
        var name = node[0].cap || 'noname',
            sector = da / (node.length - 1),
            radA;
        ctx.save();
        for(var m in node[0].default) ctx[m] = node[0].default[m]; //local styles
        var w = ctx.measureText(name).width + margin*2;
        radA = Math.max(r, parseInt(ctx.font.split(' ')[0].replace('px', '')) / Math.sin(Math.min(da, Math.PI/3))) + w;
        
        ctx.save();
        if(node[0].mark) for(var m in style.select) ctx[m] = style.select[m]; //if selected node set style
        else for(var m in style.default) ctx[m] = style.default[m];
        if(node === map) radA = 20; //СВЕРТКА пути! //TODO: опциональность
        //if(da === Math.PI*2) radA = 20; //СВЕРТКА пути! //TODO: опциональность
        ctx.beginPath();
        if(r)ctx.arc(0, 0, r , a, a+da);
        ctx.arc(0, 0, radA - margin, a+da, a, true);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        //if(da !== Math.PI*2){ //СВЕРТКА пути! //TODO: опциональность
            ctx.rotate(a+da/2); //TODO: one transform // +da/2 cos vertical centred
            ctx.translate(radA - w/2 - margin, 0);
            if(Math.cos(a+da/2) < 0) ctx.scale(-1,-1);
            ctx.fillText(name, 0, 0);
        //}
        ctx.restore();
        
        if(lim <= 0)return;
        for(var k = 1; k < node.length; k++)
            ctx.draw(node[k], a+sector * (k-1), sector, radA, lim - 1);
    }
    
    var targets = [],
        way = map;
    ctx.sel = {
        /** открыть карту с уровня пункта */
        way : function(node){},
        /** открыть окно опций для переданного пункта */
        opt : function(node){
            if(!node){
                if(ids.box.style.display !== 'none'){
                    ids.box.style.display = 'none';
                    ctx.sel.one();
                }
                return
            }
            ctx.sel.one(node);
            ids.child.select();
            ids.box.style.display = 'block';
            ids.node.value = node[0].cap || 'none';
            ids.child.focus();
        },
        
        /** добавить пункт в карту */
        add : function(node){
            
        },
        /** удалить пункт из карты */
        del : function(node, notSync){ //удаляет пункт
            if(node === map)return; //нельзя удалить корневой пункт
            if(!notSync) //толко если у пункта есть родитель, он наверняка не корневой, и его можно удалить из базы!
                iddb.del(node) //удалить из базы
            var parent = node[0].parent,
                idx = parent.indexOf(node);
            console.log('DELETE', node[0].cap + ' ' + idx, 'child of', parent && parent[0].cap || 'none');
            ctx.sel.pop(node);
            parent.splice(idx, 1);
            console.log(map);
        },
        /** переместить выбранное в сообщенный пункт */
        mov : function(node){
            //TODO: remove iddb
            if(~targets.indexOf(map)) ctx.sel.pop(map); //перетаскивание корня! //TODO: можно перегрузить на выход вверх
            if(~targets.indexOf(node)) ctx.sel.pop(node); //перетаскивание на себя! //TODO: можно перегрузить
            for(var t; t = targets[targets.length-1];){
                ctx.sel.del(t, node);
                if (node) {
                    node.push(t);
                    iddb.mov(t, node);
                    t[0].parent = node; //защита пункта от удаления из базы (пункт без родителя считается корневым и не может быть удален)
                }
            }
        },
        
        /** получить список выбранных на данный момент пунктов */
        get : function(){return targets},
        /** выбор только переданного пункта или снятие всего выбора, не передан */
        one : function(node){
            //console.log('before',targets); //DEBUG:
            for(var n = targets.length; n--;) ctx.sel.pop(targets[n]);
            if(node) ctx.sel.set(node);
            //console.log('after',targets); //DEBUG:
        },
        
        /** добавить переданный пункт к выбранным */
        set : function(node){ //добавляет пункт к выбранным
            if(!node)return;
            if(node[0].mark) return; //if already keep return
            node[0].mark = 1;
            targets.push(node);
            //ctx.draw(node); //TODO: out from API ?
        },
        /** убрать переданный пункт из выбора */
        pop : function(node){ //убирает пункт из выбранных (если он выбран) //TODO: nodes[] support
            if(!node)return;
            if(!node[0].mark)return; //if already free return
            node[0].mark = 0; //TODO: multiuser(color) select can be add here if check bits
            var idx = targets.indexOf(node);
            if(!~idx)console.log('error drop target', idx, node, 'from', targets);//DEBUG: check targets work
            targets.splice(idx, 1);
        },
        /** инвертировать выбор на переданном пункте */
        xor : function(node){
            //console.log('before',targets); //DEBUG:
            if(!node)return;
            if(node[0].mark) ctx.sel.pop(node); else ctx.sel.set(node);
            //console.log('after',targets); //DEBUG:
        }
    }
    return ctx;
}