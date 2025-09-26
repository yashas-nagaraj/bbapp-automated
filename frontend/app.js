const API_BASE = `http://${window.location.hostname}:3000/api`;

function escapeHtml(s){ return (s||'').toString().replace(/[&<>\"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])); }

async function loadSeasons(){
  try{
    const res = await fetch(API_BASE + '/seasons');
    const seasons = await res.json();
    const grid = document.getElementById('seasons-grid');
    if(!grid) return;
    grid.innerHTML = '';
    seasons.forEach(s => {
      const card = document.createElement('article');
      card.className = 'season-card';
      card.innerHTML = `
        <h3>Season ${escapeHtml(s.season)} — ${escapeHtml(String(s.episodes))} episodes</h3>
        <p class="season-summary">${escapeHtml(s.summary)}</p>
      `;
      grid.appendChild(card);
    });
  }catch(e){ console.error('loadSeasons', e); }
}

async function loadLatestQuestions(){
  try{
    const res = await fetch(API_BASE + '/questions');
    if(!res.ok) throw new Error('questions fetch failed: ' + res.status);
    const qs = await res.json();
    const list = document.getElementById('latest-questions');
    if(!list) return;
    list.innerHTML = '';
    for(const q of qs){
      const li = document.createElement('li');
      li.className = 'question-item';
      li.innerHTML = `
        <div class="q-head"><strong>${escapeHtml(q.name||'Anonymous')}</strong>
          <span class="q-time">${new Date(q.created_at).toLocaleString()}</span>
        </div>
        <div class="q-body">${escapeHtml(q.question)}</div>
        <div class="answers" data-qid="${q.id}">
          <div class="answers-list" id="answers-${q.id}"></div>
          <form class="a-form" data-qid="${q.id}">
            <input class="a-name" placeholder="Your name (optional)" />
            <input class="a-text" placeholder="Write an answer..." />
            <button class="btn small a-submit">Answer</button>
          </form>
        </div>
      `;
      list.appendChild(li);
      loadAnswers(q.id);
    }
    document.querySelectorAll('.a-form').forEach(f=>{
      f.addEventListener('submit', async ev=>{
        ev.preventDefault();
        const qid = f.getAttribute('data-qid');
        const name = f.querySelector('.a-name').value || 'Anonymous';
        const answer = f.querySelector('.a-text').value;
        if(!answer) return alert('Write an answer');
        const ok = await postAnswer(qid, name, answer);
        if(ok){ f.querySelector('.a-text').value=''; f.querySelector('.a-name').value=''; loadAnswers(qid); }
        else alert('Failed to post answer');
      });
    });
  }catch(e){ console.error('loadLatestQuestions', e); }
}

async function loadAnswers(question_id){
  try{
    const res = await fetch(API_BASE + '/answers/' + question_id);
    if(!res.ok) return;
    const answers = await res.json();
    const container = document.getElementById('answers-' + question_id);
    if(!container) return;
    container.innerHTML = answers.map(a=>`<div class="answer"><strong>${escapeHtml(a.name)}</strong>: ${escapeHtml(a.answer)} <div class="a-time">${new Date(a.created_at).toLocaleString()}</div></div>`).join('');
  }catch(e){ console.error('loadAnswers', e); }
}

async function postQuestion(name, question){
  try{
    const r = await fetch(API_BASE + '/questions', {
      method:'POST',
      headers:{'content-type':'application/json'},
      body: JSON.stringify({name, question})
    });
    return r.ok;
  }catch(e){ console.error('postQuestion', e); return false; }
}

async function postAnswer(question_id, name, answer){
  try{
    const r = await fetch(API_BASE + '/answers', {
      method:'POST',
      headers:{'content-type':'application/json'},
      body: JSON.stringify({question_id, name, answer})
    });
    return r.ok;
  }catch(e){ console.error('postAnswer', e); return false; }
}

document.addEventListener('DOMContentLoaded', ()=>{
  if(document.getElementById('seasons-grid')){
    loadSeasons();
    loadLatestQuestions();
    const form = document.getElementById('q-form');
    if(form){
      form.addEventListener('submit', async ev=>{
        ev.preventDefault();
        const name = document.getElementById('name').value || 'Anonymous';
        const question = document.getElementById('question').value;
        if(!question) return alert('Please write a question');
        const ok = await postQuestion(name, question);
        if(ok){
          document.getElementById('question').value=''; document.getElementById('name').value='';
          await loadLatestQuestions();
          const list = document.getElementById('latest-questions');
          if(list) list.scrollTop = list.scrollHeight;
        } else alert('Failed to submit question');
      });
    }
  }
});
