// Injects the shared header and footer into the page
function injectHeaderFooter() {
  const headerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark shadow-sm py-2" style="position:fixed;top:0;left:0;width:100%;z-index:1000;background:linear-gradient(90deg, #0d6efd 60%, #23395d 100%);backdrop-filter:blur(2px);">
      <div class="container-fluid">
        <a class="navbar-brand d-flex align-items-center" href="suvicharsathi.html">
          <img src="assets/images/logo.png" alt="SuvicharSathi Logo" style="height:40px; margin-right:12px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <span style="font-size:1.6rem; font-weight:700; letter-spacing:1px;">सुविचारसाथी</span>
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
            <li class="nav-item"><a class="nav-link fw-semibold" href="suvicharsathi.html">Home</a></li>
            <li class="nav-item"><a class="nav-link fw-semibold" href="pricing.html">Pricing</a></li>
            <li class="nav-item"><a class="nav-link fw-semibold" href="privacy.html">Privacy Policy</a></li>
            <li class="nav-item"><a class="nav-link fw-semibold" href="refund.html">Refund Policy</a></li>
          </ul>
        </div>
      </div>
    </nav>
  `;
  const footerHTML = `
    <footer class="text-center" style="background:linear-gradient(90deg, #0d6efd 60%, #23395d 100%); color:#fff; border-top:2px solid #e3e3e3; position:fixed; left:0; bottom:0; width:100%; z-index:999; padding:8px 0 4px 0; font-size:0.97rem;">
      <span>📧 <a href="mailto:contact@suyogjoshi.com" style="color:#fff; text-decoration:underline;">contact@suyogjoshi.com</a></span>
      <span style="margin:0 10px;">|</span>
      <span><a href="suvicharsathi.html" style="color:#fff;">Home</a> | <a href="pricing.html" style="color:#fff;">Pricing</a> | <a href="privacy.html" style="color:#fff;">Privacy</a> | <a href="refund.html" style="color:#fff;">Refund</a></span>
      <span style="margin:0 10px;">|</span>
      <span>&copy; 2025 Suyog Joshi. All rights reserved.</span>
    </footer>
  `;
  document.getElementById('shared-header').innerHTML = headerHTML;
  document.getElementById('shared-footer').innerHTML = footerHTML;
}

document.addEventListener('DOMContentLoaded', injectHeaderFooter);
