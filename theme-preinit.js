(function(){
	try{
		var d=document.documentElement;
		d.classList.add('no-transitions');
		var saved=localStorage.getItem('theme');
		var isDark;
		if(saved===null){
			// По умолчанию всегда тёмная тема
			localStorage.setItem('theme','dark');
			isDark = true;
		}else{
			isDark = (saved==='dark');
		}
		if(isDark){ d.classList.add('dark'); } else { d.classList.remove('dark'); }
	}catch(e){}
})();

