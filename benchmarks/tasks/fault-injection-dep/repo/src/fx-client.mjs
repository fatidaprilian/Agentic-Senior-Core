export async function fetchExchangeRate(url, { fetchImpl = fetch, timeoutMs = 500, signal } = {}) {
  try {
    const res = await fetchImpl(url);
    const data = await res.json();
    return data.rate;
  } catch (err) {
    return null;
  }
}
