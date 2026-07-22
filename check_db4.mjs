async function check() {
  const res = await fetch("https://frdfjiurwodihtpmnceh.supabase.co/rest/v1/?apikey=sb_publishable_vySmN0c_LaUj28Bzn2abWQ_dOKXOlg9");
  const data = await res.json();
  console.log(Object.keys(data.definitions || {}));
}
check();
