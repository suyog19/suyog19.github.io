// Contact form feedback
document.addEventListener('DOMContentLoaded', function() {
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var name = contactForm.elements['name'].value.trim();
      var email = contactForm.elements['email'].value.trim();
      var message = contactForm.elements['message'].value.trim();
      var msgDiv = document.getElementById('form-message');
      // Simple field-level validation
      if (!name || !email || !message) {
        msgDiv.style.display = 'block';
        msgDiv.style.color = '#dc3545';
        msgDiv.textContent = 'Please fill out all fields.';
        setTimeout(function() { msgDiv.style.display = 'none'; }, 3000);
        return;
      }
      // Email format validation
      var emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (!emailPattern.test(email)) {
        msgDiv.style.display = 'block';
        msgDiv.style.color = '#dc3545';
        msgDiv.textContent = 'Please enter a valid email address.';
        setTimeout(function() { msgDiv.style.display = 'none'; }, 3000);
        return;
      }
      // If all validations pass, open mailto link
      var mailto = 'mailto:contact@suyogjoshi.com'
        + '?subject=' + encodeURIComponent('Contact from Website: ' + name)
        + '&body=' + encodeURIComponent('Name: ' + name + '\nEmail: ' + email + '\nMessage: ' + message);
      window.location.href = mailto;
      // Optionally show feedback
      msgDiv.style.display = 'block';
      msgDiv.style.color = '#28a745';
      msgDiv.textContent = 'Opening your email application...';
      contactForm.reset();
      setTimeout(function() { msgDiv.style.display = 'none'; }, 4000);
    });
  }
});
function openSkillsModal() {
  document.getElementById('skills-modal').classList.remove('hidden');
}

function closeSkillsModal() {
  document.getElementById('skills-modal').classList.add('hidden');
}
// script.js
function switchLang(lang) {
  fetch(`lang/${lang}.json`)
    .then(response => response.json())
    .then(data => {
      document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        if (data[key]) el.textContent = data[key];
      });
    });
}
function openChatbot() {
  document.getElementById('chatbot').classList.remove('hidden');
  document.getElementById('chatbot-modal').classList.remove('hidden');
  document.getElementById('chatbot-modal').style.display = 'flex';
  document.getElementById('chatbot-header').style.display = 'flex';
  document.getElementById('chatbot-body').style.display = 'flex';
  document.getElementById('chatbot-loader').style.display = 'block';
  var iframe = document.getElementById('chatbot-iframe');
  iframe.style.display = 'none';
  iframe.src = 'https://suyog19-career-conversation.hf.space/';
}

function hideChatbotLoader() {
  document.getElementById('chatbot-loader').style.display = 'none';
  document.getElementById('chatbot-iframe').style.display = 'block';
}
function closeChatbot() {
  document.getElementById('chatbot').classList.add('hidden');
  document.getElementById('chatbot-modal').classList.add('hidden');
  document.getElementById('chatbot-modal').style.display = 'none';
  document.getElementById('chatbot-header').style.display = 'none';
  document.getElementById('chatbot-body').style.display = 'none';
  document.getElementById('chatbot-loader').style.display = 'none';
  var iframe = document.getElementById('chatbot-iframe');
  iframe.style.display = 'none';
  iframe.src = '';
}
function sendEmail(event) {
  event.preventDefault();
  alert('Message sent! This will be integrated with a backend or mailto link.');
}

function toggleMenu() {
  const navList = document.getElementById('nav-list');
  navList.classList.toggle('open');
  const menuIcon = document.querySelector('.menu-icon i');
  if (navList.classList.contains('open')) {
    menuIcon.classList.remove('fa-bars');
    menuIcon.classList.add('fa-times');
  } else {
    menuIcon.classList.remove('fa-times');
    menuIcon.classList.add('fa-bars');
  }
}

function toggleLangDropdown(event) {
  event.stopPropagation();
  const menu = document.querySelector('.custom-lang-dropdown .dropdown-menu');
  menu.classList.toggle('hidden');
}

// Hide dropdown when clicking outside
document.addEventListener('click', function(e) {
  const menu = document.querySelector('.custom-lang-dropdown .dropdown-menu');
  if (menu && !menu.classList.contains('hidden')) {
    menu.classList.add('hidden');
  }
});

// Demo Modal Functions
function openDemoModal(demoUrl) {
  if (demoUrl) {
    window.open(demoUrl, '_blank', 'noopener');
  } else {
    alert('Demo not available.');
  }
}

function closeDemoModal() {
  const modal = document.getElementById('demo-modal');
  const content = document.getElementById('demo-content');
  modal.classList.add('hidden');
  content.innerHTML = '';
}

function openLightbox(img) {
  document.getElementById('lightbox-img').src = img.src;
  document.getElementById('lightbox-modal').classList.remove('hidden');
}
function closeLightbox() {
  document.getElementById('lightbox-modal').classList.add('hidden');
  document.getElementById('lightbox-img').src = '';
}
