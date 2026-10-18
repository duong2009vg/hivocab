// Small pre-React bootstrap. It only derives the initial route and theme;
// authentication remains owned by AuthProvider after React mounts.
(function bootstrapHiVocab() {
  try {
    document.documentElement.classList.remove('dark');

    var h = new Date().getHours();
    var autoTheme = (h >= 0 && h < 4) ? 'ocean'
      : (h >= 4 && h < 12) ? 'morning'
      : (h >= 12 && h < 18) ? 'afternoon'
      : 'night';
    var saved = localStorage.getItem('colour-theme');
    var themes = ['ocean', 'morning', 'afternoon', 'night'];
    var theme = saved && themes.indexOf(saved) !== -1 ? saved : autoTheme;
    document.documentElement.setAttribute('data-theme', theme);

    var hasAuth = false;
    for (var i = 0; i < localStorage.length; i += 1) {
      var key = localStorage.key(i);
      if (key && key.indexOf('sb-') === 0 && key.indexOf('-auth-token') !== -1) {
        try {
          var tokenData = JSON.parse(localStorage.getItem(key) || '{}');
          if (tokenData && (tokenData.access_token || tokenData.refresh_token || tokenData.user)) {
            hasAuth = true;
            break;
          }
        } catch (_) {}
      }
    }

    var curPath = (window.location.pathname || '').replace(/^\/+/, '').replace(/\/+$/, '');
    var curHash = (window.location.hash || '').replace(/^#/, '').replace(/^page-/, '');
    var isAuthHash = curHash.indexOf('access_token=') !== -1 || curHash.indexOf('error=') !== -1;
    var isDeckRoute = curHash.indexOf('d=') === 0 || curHash.indexOf('deck=') === 0 ||
      curHash.indexOf('topic=') === 0 || curHash.indexOf('library') === 0;
    var isLoginRoute = curHash === 'login' || curPath === 'login';
    var guestEntered = sessionStorage.getItem('hivocab_guest_entered') === '1';

    if (hasAuth) {
      window._isPreAuthenticated = true;
      document.documentElement.classList.add('user-logged-in');
      var initialRoute = isDeckRoute ? 'library'
        : ((!curHash || curHash === 'landing' || isLoginRoute || isAuthHash)
          ? 'dashboard'
          : curHash.split('?')[0]);
      document.documentElement.setAttribute('data-initial-route', initialRoute);
    } else if (isLoginRoute) {
      document.documentElement.setAttribute('data-initial-route', 'login');
    } else if (guestEntered) {
      document.documentElement.setAttribute('data-initial-route', curHash || curPath || 'dashboard');
    } else {
      document.documentElement.setAttribute('data-initial-route', 'landing');
    }
  } catch (_) {
    document.documentElement.setAttribute('data-initial-route', 'landing');
  }
})();
