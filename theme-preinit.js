(function(){
	try{
		var d=document.documentElement;
		d.classList.add('no-transitions');
		var saved=localStorage.getItem('theme');
		var isDark=saved?saved==='dark':(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);
		if(isDark){ d.classList.add('dark'); } else { d.classList.remove('dark'); }
	}catch(e){}
})();

