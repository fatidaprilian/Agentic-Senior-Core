export function createApp({ db, fetcher }) {
  return async function handleRequest(req) {
    const url = new URL(req.url, 'http://localhost');
    const userId = req.headers?.['x-user-id'] || '';

    if (req.method === 'GET' && url.pathname === '/api/users') {
      const q = url.searchParams.get('q') || '';
      const rows = await db.query(`SELECT id, name FROM users WHERE name LIKE '%${q}%'`);
      return { status: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ users: rows }) };
    }

    if (req.method === 'GET' && url.pathname.startsWith('/api/invoices/')) {
      const id = url.pathname.slice('/api/invoices/'.length);
      const invoice = await db.findInvoiceById(id);
      if (!invoice) return { status: 404, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Not found' }) };
      return { status: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify(invoice) };
    }

    if (req.method === 'GET' && url.pathname === '/api/greet') {
      const name = url.searchParams.get('name') || 'Guest';
      return { status: 200, headers: { 'content-type': 'text/html' }, body: `<h1>Hello ${name}</h1>` };
    }

    if (req.method === 'POST' && url.pathname === '/api/webhook-preview') {
      const targetUrl = req.body?.url;
      if (!targetUrl) return { status: 400, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'url required' }) };
      const res = await fetcher(targetUrl);
      return { status: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ok: true, data: res }) };
    }

    return { status: 404, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Not found' }) };
  };
}
