export class Path{
	constructor(/*polymorphic constructor*/){
		this._isRelative;
		this._components = [];
		
		if (typeof arguments[0] == 'string'){
			this.componentsString = arguments[0];
		}
		else if (arguments[0] instanceof Component && arguments[1] instanceof Path){
			this._components.push(arguments[0]);
			this._components = this._components.concat(arguments[1]);
		}
		else if (arguments[0] instanceof Array){
			this._components = this._components.concat(arguments[0]);
			this._isRelative = !!arguments[1];
		}
	}
	get isRelative(){
		return this._isRelative;
	}
	get components(){
		return this._components;
	}
	get head(){
		if (this.components.length > 0) {
			return this.components[0];
		} else {
			return null;
		}
	}
	get tail(){
		if (this.components.length >= 2) {
			var tailComps = this.components.slice(1, this.components.length);//careful, the original code uses length-1 here. This is because the second argument of List.GetRange is a number of elements to extract, wherease Array.slice uses an index
			return new Path(tailComps);
		}
		else {
			return Path.self;
		}
	}
	get length(){
		return this.components.length;
	}
	get lastComponent(){
		if (this.components.length > 0) {
			return this.components[this.components.length - 1];
		} else {
			return null;
		}
	}
	get containsNamedComponent(){
		for (var i = 0, l = this.components.length; i < l; i++){
			if (!this.components[i].isIndex){
				return true;
			}
		}
		return false;
	}
	static get self(){
		var path = new Path();
		path._isRelative = true;
		return path;
	}
	
	PathByAppendingPath(pathToAppend){
		var p = new Path();

		var upwardMoves = 0;
		for (var i = 0; i < pathToAppend.components.length; ++i) {
			if (pathToAppend.components[i].isParent) {
				upwardMoves++;
			} else {
				break;
			}
		}

		for (var i = 0; i < this.components.length - upwardMoves; ++i) {
			p.components.push(this.components[i]);
		}

		for(var i = upwardMoves; i < pathToAppend.components.length; ++i) {
			p.components.push(pathToAppend.components[i]);
		}

		return p;
	}
	get componentsString(){
		var compsStr = this.components.join(".");
		if (this.isRelative)
			return "." + compsStr;
		else
			return compsStr;
	}
	set componentsString(value){
		this.components.length = 0;

		var componentsStr = value;
		
		if (componentsStr == null || componentsStr == '') return;

		// When components start with ".", it indicates a relative path, e.g.
		//   .^.^.hello.5
		// is equivalent to file system style path:
		//  ../../hello/5
		if (componentsStr[0] == '.') {
			this._isRelative = true;
			componentsStr = componentsStr.substring(1);
		}

		var componentStrings = componentsStr.split('.');
		componentStrings.forEach(str => {
			//we need to distinguish between named components that start with a number, eg "42somewhere", and indexed components
			//the normal parseInt won't do for the detection because it's too relaxed.
			//see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt
			if (/^(\-|\+)?([0-9]+|Infinity)$/.test(str)){
				this.components.push(new Component(parseInt(str)));
			}
			else{
				this.components.push(new Component(str));
			}
		});
	}
	toString(){
		return this.componentsString;
	}
	Equals(otherPath){
		if (otherPath == null)
			return false;

		if (otherPath.components.length != this.components.length)
			return false;

		if (otherPath.isRelative != this.isRelative)
			return false;
		
		//the original code uses SequenceEqual here, so we need to iterate over the components manually.
		for (var i = 0, l = otherPath.components.length; i < l; i++){
			//it's not quite clear whether this test should use Equals or a simple == operator, see https://github.com/y-lohse/inkjs/issues/22
			if (!otherPath.components[i].Equals(this.components[i])) return false;
		}

		return true;
	}
}

class Component{
	constructor(indexOrName){
		if (typeof indexOrName == 'string'){
			this._index = -1;
			this._name = indexOrName;
		}
		else{
			this._index = parseInt(indexOrName);
			this._name = null;
		}
	}
	get index(){
		return this._index;
	}
	get name(){
		return this._name;
	}
	get isIndex(){
		return this.index >= 0;
	}
	get isParent(){
		return this.name == Path.parentId;
	}
	
	static ToParent(){
		return new Component(Path.parentId);
	}
	toString(){
		if (this.isIndex) {
			return this.index.toString();
		} else {
			return this.name;
		}
	}
	Equals(otherComp){
		if (otherComp != null && otherComp.isIndex == this.isIndex) {
			if (this.isIndex) {
				return this.index == otherComp.index;   
			} else {
				return this.name == otherComp.name;
			}
		}

		return false;
	}
}

Path.parentId = "^";
Path.Component = Component;