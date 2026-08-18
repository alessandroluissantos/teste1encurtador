// Cole abaixo as chaves do seu projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAY0-bsCNhUTrN_c8sidBeaE8LIhQkY06A",
  authDomain: "encurtadorlinksaula.firebaseapp.com",
  projectId: "encurtadorlinksaula",
  storageBucket: "encurtadorlinksaula.firebasestorage.app",
  messagingSenderId: "317607740353",
  appId: "1:317607740353:web:3d0a5b57205d7cfba72540"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Redirecionamento dinâmico ao acessar a URL encurtada
window.onload = async () => {
  const path = window.location.pathname.substring(1);
  if (path && path !== "index.html") {
    const doc = await db.collection("links").doc(path).get();
    if (doc.exists) {
      window.location.href = doc.data().originalUrl;
    }
  }
};

async function callGemini(prompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

document.getElementById("btnSuggest").addEventListener("click", async () => {
  const url = document.getElementById("longUrl").value;
  const apiKey = document.getElementById("geminiKey").value;
  if (!url || !apiKey) return alert("Informe a URL e a API Key!");

  const prompt = `Gere apenas uma palavra em minúsculas com hífen para esta URL: ${url}. Responda APENAS com o texto curto.`;
  try {
    const suggestion = await callGemini(prompt, apiKey);
    document.getElementById("customSlug").value = suggestion.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  } catch (err) {
    alert("Erro na consulta do Gemini.");
  }
});

document.getElementById("btnShorten").addEventListener("click", async () => {
  const originalUrl = document.getElementById("longUrl").value;
  let slug = document.getElementById("customSlug").value.trim();
  const apiKey = document.getElementById("geminiKey").value;

  if (!originalUrl) return alert("Insira uma URL!");
  if (!slug) slug = Math.random().toString(36).substring(2, 8);

  let summary = "";
  if (apiKey) {
    try {
      summary = await callGemini(`Resuma em até 15 palavras do que se trata esta URL: ${originalUrl}`, apiKey);
    } catch(e) {}
  }

  await db.collection("links").doc(slug).set({
    originalUrl: originalUrl,
    summary: summary,
    createdAt: new Date()
  });

  const shortUrl = `${window.location.origin}/${slug}`;
  document.getElementById("shortLink").href = shortUrl;
  document.getElementById("shortLink").innerText = shortUrl;
  document.getElementById("summaryText").innerText = summary ? `Resumo da IA: ${summary}` : "";
  document.getElementById("result").classList.remove("hidden");
});
