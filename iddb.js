var iddb = (function(dbName, ver){
    ver = ver || 7;
    var OPT = 0, DEF = 1, storstr = ["opt", "def"];
    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    var db = indexedDB.open(dbName, ver);
    var obj, kid;
    db.onupgradeneeded = function(e){//storstr.forEach(function(v){ e.currentTarget.result.createObjectStore(v, {keyPath:"id", autoIncrement: true}) });
        var db = e.currentTarget.result
        var stor = [db.createObjectStore(storstr[OPT], {keyPath:"id", autoIncrement: true}),
                    db.createObjectStore(storstr[DEF], {keyPath:"id", autoIncrement: false})];
        stor[OPT].createIndex('parent', 'parent', { unique: false });
        
        stor[OPT].add({cap: 'root', parent: 'root'}).onsuccess = function(e){
            stor[DEF].add({id : e.target.result});
        }
        //saveDB(json, stor); onJsonLoaded(json)
    }
    function saveDB(node, stor, parentId){
            node[0].parent = parentId || 'root';
            var opt2db = {}, def2db = {};
            for(var k in node[0])
                if (k == 'default') for(var j in node[0].default) def2db[j] = node[0].default[j];
                else opt2db[k] = node[0][k];
            
            stor[OPT].add( opt2db ).onsuccess = function(e){
                def2db.id = opt2db.id = node[0].id = e.target.result;
                stor[DEF].add( def2db );
                for(var n = node.length; --n ;) saveDB(node[n], node[0].id);
            };
        }
    db.onsuccess = function(){
        var transaction = this.result.transaction(storstr, "readwrite"),
            stor = storstr.map(function(v, i){ return transaction.objectStore(v) });
        //saveDB(json, stor); onJsonLoaded(json); //импортировать json в базу данных и запустить mindmap
        loadDB();
        
        function loadDB(){
            obj = [];
            stor[OPT].openCursor().onsuccess = function(e) {
                var cur = e.target.result;
                if (cur) {
                    obj[cur.value.id] = [cur.value];
                    cur.continue();
                } else {
                    stor[DEF].openCursor().onsuccess = function(e) {
                        var cur = e.target.result;
                        if (!cur) return done();
                        var id = cur.value.id;
                        delete cur.value.id;
                        obj[id][0].default = cur.value;
                        cur.continue();
                    };
                }
            };
            function done(){
                var root;
                obj.forEach(function(v, i){
                    if( v[0].parent == 'root' ) return root = i;
                    obj[v[0].parent].push(v);
                })
                
                console.log('root', root);
                console.log('obj', obj);
                onJsonLoaded(obj[root]); //TODO: async auto detect modification api
            }
        };
    };
    return {
        add : function(node, parent){
            var opt2db = {}, def2db = {};
            for(var k in node[0])
                if (k == 'default') for(var j in node[0].default) def2db[j] = node[0].default[j];
                else if (k == 'parent' && node[0].parent[0]) opt2db.parent = node[0].parent[0].id;
                else if (k != 'id') opt2db[k] = node[0][k];
            if(parent) opt2db.parent = parent[0].id;
            
            indexedDB.open(dbName, ver).onsuccess = function(){
                var transaction = this.result.transaction(storstr, "readwrite"),
                    stor = storstr.map(function(v, i){ return transaction.objectStore(v) });
                stor[OPT].add( opt2db ).onsuccess = function(e){
                    node[0].id = e.target.result;
                    def2db.id = node[0].id;
                    stor[DEF].add( def2db );
                }
            }
        },
        del : function(node){
            var id = node[0].id;
            console.log('IDDB.DEL',node);
            indexedDB.open(dbName, ver).onsuccess = function(){
                var transaction = this.result.transaction(storstr, "readwrite"),
                    stor = storstr.map(function(v, i){ return transaction.objectStore(v) });
                (function delKid(id){
                    stor[OPT].index("parent").openCursor(IDBKeyRange.only(id)).onsuccess = function(e) {
                        var cur = e.target.result;
                        if(!cur) return;
                        delKid(cur.primaryKey);
                        stor[OPT].delete(cur.primaryKey);
                        stor[DEF].delete(cur.primaryKey);
                        cur.continue();
                    }
                })(id);
                stor[OPT].delete(id);
                stor[DEF].delete(id);
            }
        },
        mov : function(node, parent){
            var opt2db = {}, def2db = {id : node[0].id};
            for(var k in node[0])
                if (k == 'default') for(var j in node[0].default) def2db[j] = node[0].default[j];
                else if (k == 'parent' && node[0].parent[0]) opt2db.parent = node[0].parent[0].id;
                else if (k != 'mark') opt2db[k] = node[0][k];

            if(parent) opt2db.parent = parent[0].id;
            console.log('IDDB.MOV','opt2db', opt2db, 'def2db', def2db);
            
            indexedDB.open(dbName, ver).onsuccess = function(){
                var transaction = this.result.transaction(storstr, "readwrite"),
                    stor = storstr.map(function(v, i){ return transaction.objectStore(v) });
                stor[OPT].put( opt2db )
                stor[DEF].put( def2db );
            }
        }
    };
})("test");