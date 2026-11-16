// Halaman login (index.html)
(async () => {
  if (SUPABASE_URL.includes('GANTI')) toast('Isi dulu SUPABASE_URL & SUPABASE_ANON_KEY di js/config.js', 1);
  const { data: { session } } = await sb.auth.getSession();
  if (session) { location.replace('dashboard.html'); return; }
  $('#lf').onsubmit = async e => {
    e.preventDefault();
    const u = $('#lu').value.trim().toLowerCase();
    const { error } = await sb.auth.signInWithPassword({ email: u + EMAIL_DOMAIN, password: $('#lp').value });
    if (error) { console.error(error); toast('Login gagal: ' + error.message, 1); return; }
    location.href = 'dashboard.html';
  };
})();
