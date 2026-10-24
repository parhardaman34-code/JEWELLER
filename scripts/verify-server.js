async function check() {
  const res = await fetch('http://localhost:3000');
  const html = await res.text();
  console.log('HTTP Status:', res.status, '- Length:', html.length);
  console.log('Has site-header:', html.includes('id="site-header"'));
  console.log('Has original-website:', html.includes('id="original-website"'));
  console.log('Has bridal sets:', html.includes('Bridal Sets'));
  console.log('Has showroom directions:', html.includes('Get Showroom Directions'));
}
check().catch(console.error);
