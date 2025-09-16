// Firebase Config (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyABNsM1iXFLPz0P2-qXrUe_NQ42LMdrWEo",
  authDomain: "thinkbit-471218.firebaseapp.com",
  projectId:  "thinkbit-471218",
  storageBucket: "thinkbit-471218.firebasestorage.app",
  messagingSenderId: "170494573626",
  appId: "1:170494573626:web:73d7211f47128be6850903"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 LegalEase AI Home page loaded");

  // Elements
  const loginBtn = document.getElementById("login-btn");
  const signupBtn = document.getElementById("signup-btn");
  const loginModal = document.getElementById("login-modal");
  const signupModal = document.getElementById("signup-modal");
  const closeBtns = document.querySelectorAll(".close");

  // Enhanced modal opening with smooth animations
  loginBtn.addEventListener("click", () => {
    loginModal.classList.add("show");
    document.body.style.overflow = "hidden";
  });

  signupBtn.addEventListener("click", () => {
    signupModal.classList.add("show");
    document.body.style.overflow = "hidden";
  });

  // Close modals with improved UX
  closeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const modalId = btn.getAttribute("data-close");
      const modal = document.getElementById(modalId);
      modal.classList.remove("show");
      document.body.style.overflow = "auto";
    });
  });

  // Close modal when clicking outside with smooth transition
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.classList.remove("show");
      document.body.style.overflow = "auto";
    }
  });

  // Enhanced notification system
  function showNotification(message, type = 'success') {
    // Create a toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      border-radius: 12px;
      color: white;
      font-weight: 600;
      z-index: 10000;
      animation: slideInRight 0.3s ease;
      max-width: 350px;
      word-wrap: break-word;
      ${type === 'success' ? 'background: linear-gradient(135deg, #10b981, #059669);' : 'background: linear-gradient(135deg, #ef4444, #dc2626);'}
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Add slide animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
      toast.style.animation = 'slideInRight 0.3s ease reverse';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      }, 300);
    }, 3000);
  }

  // Login Form with enhanced UX
  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Basic validation
    if (!email || !password) {
      showNotification("Please fill in all fields", 'error');
      return;
    }

    if (!isValidEmail(email)) {
      showNotification("Please enter a valid email address", 'error');
      return;
    }
    
    // Add loading state
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Signing In...';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.8';

    try {
      await auth.signInWithEmailAndPassword(email, password);
      showNotification("🎉 Welcome back! Redirecting to app...", 'success');
      loginModal.classList.remove("show");
      document.body.style.overflow = "auto";
      
      // Reset form
      e.target.reset();
      
      // Redirect to /upload after successful login
      setTimeout(() => {
        window.location.href = '/upload';
      }, 1500); // Wait 1.5 seconds to show the success message
      
    } catch (error) {
      let errorMessage = "Login failed. Please try again.";
      
      // Handle specific Firebase errors
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "No account found with this email address.";
          break;
        case 'auth/wrong-password':
          errorMessage = "Incorrect password. Please try again.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email address format.";
          break;
        case 'auth/user-disabled':
          errorMessage = "This account has been disabled.";
          break;
        default:
          errorMessage = error.message;
      }
      
      showNotification(`❌ ${errorMessage}`, 'error');
    } finally {
      // Restore button state
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  });

  // Signup Form with enhanced UX
  document.getElementById("signup-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;
    const name = document.getElementById("signup-name").value.trim();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Enhanced validation
    if (!name || !email || !password) {
      showNotification("Please fill in all fields", 'error');
      return;
    }

    if (name.length < 2) {
      showNotification("Name must be at least 2 characters long", 'error');
      return;
    }

    if (!isValidEmail(email)) {
      showNotification("Please enter a valid email address", 'error');
      return;
    }

    if (password.length < 6) {
      showNotification("Password must be at least 6 characters long", 'error');
      return;
    }
    
    // Add loading state
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating Account...';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.8';

    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      
      // Update user profile with name
      await userCredential.user.updateProfile({ 
        displayName: name 
      });
      
      showNotification("🎉 Account created successfully! Redirecting to app...", 'success');
      signupModal.classList.remove("show");
      document.body.style.overflow = "auto";
      
      // Reset form
      e.target.reset();
      
      // Auto-redirect to /upload after successful signup
      setTimeout(() => {
        window.location.href = '/upload';
      }, 2000); // Wait 2 seconds to show the success message
      
    } catch (error) {
      let errorMessage = "Account creation failed. Please try again.";
      
      // Handle specific Firebase errors
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "An account with this email already exists.";
          break;
        case 'auth/weak-password':
          errorMessage = "Password is too weak. Please choose a stronger password.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email address format.";
          break;
        case 'auth/operation-not-allowed':
          errorMessage = "Email/password accounts are not enabled.";
          break;
        default:
          errorMessage = error.message;
      }
      
      showNotification(`❌ ${errorMessage}`, 'error');
    } finally {
      // Restore button state
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  });

  // Utility function to validate email
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Smooth scrolling for Learn More button
  const learnMoreBtn = document.querySelector('a[href="#features"]');
  if (learnMoreBtn) {
    learnMoreBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const featuresSection = document.getElementById('features');
      if (featuresSection) {
        featuresSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  }

  // Add staggered animation to features on load
  const features = document.querySelectorAll('.feature');
  features.forEach((feature, index) => {
    feature.style.animationDelay = `${index * 0.1}s`;
    feature.style.opacity = '0';
    feature.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      feature.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      feature.style.opacity = '1';
      feature.style.transform = 'translateY(0)';
    }, index * 100);
  });

  // Keyboard navigation for modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.modal.show');
      if (openModal) {
        openModal.classList.remove('show');
        document.body.style.overflow = 'auto';
      }
    }
  });

  // Enhanced form input handling
  const inputs = document.querySelectorAll('input');
  inputs.forEach(input => {
    // Add floating label effect
    input.addEventListener('focus', () => {
      input.style.transform = 'scale(1.02)';
    });
    
    input.addEventListener('blur', () => {
      input.style.transform = 'scale(1)';
    });

    // Real-time validation feedback
    input.addEventListener('input', () => {
      if (input.type === 'email' && input.value) {
        if (isValidEmail(input.value)) {
          input.style.borderColor = '#10b981';
        } else {
          input.style.borderColor = '#ef4444';
        }
      }
      
      if (input.type === 'password' && input.value) {
        if (input.value.length >= 6) {
          input.style.borderColor = '#10b981';
        } else {
          input.style.borderColor = '#f59e0b';
        }
      }
    });
  });

  // Monitor authentication state
  auth.onAuthStateChanged((user) => {
    if (user) {
      // User is signed in
      console.log('User signed in:', user.displayName || user.email);
      
      // Update UI to show user is logged in
      updateNavbarForLoggedInUser(user);
      
      // Optional: Show welcome message
      // showNotification(`Welcome back, ${user.displayName || 'User'}!`, 'success');
      
    } else {
      // User is signed out
      console.log('User signed out');
      updateNavbarForLoggedOutUser();
    }
  });

  // Function to update navbar for logged in user
  function updateNavbarForLoggedInUser(user) {
    const navRight = document.querySelector('.nav-right');
    if (navRight) {
      navRight.innerHTML = `
        <span style="color: white; margin-right: 15px; font-weight: 500;">
          Welcome, ${user.displayName || 'User'}
        </span>
        <button class="btn-outline" id="logout-btn">Logout</button>
      `;
      
      // Add logout functionality
      const logoutBtn = document.getElementById('logout-btn');
      logoutBtn.addEventListener('click', async () => {
        try {
          await auth.signOut();
          showNotification('✋ Logged out successfully', 'success');
        } catch (error) {
          showNotification('❌ Error logging out', 'error');
        }
      });
    }
  }

  // Function to update navbar for logged out user
  function updateNavbarForLoggedOutUser() {
    const navRight = document.querySelector('.nav-right');
    if (navRight) {
      navRight.innerHTML = `
        <button class="btn-outline" id="login-btn">Login</button>
        <button class="btn-primary" id="signup-btn">Sign Up</button>
      `;
      
      // Re-attach event listeners for login/signup buttons
      const newLoginBtn = document.getElementById("login-btn");
      const newSignupBtn = document.getElementById("signup-btn");
      
      newLoginBtn.addEventListener("click", () => {
        loginModal.classList.add("show");
        document.body.style.overflow = "hidden";
      });

      newSignupBtn.addEventListener("click", () => {
        signupModal.classList.add("show");
        document.body.style.overflow = "hidden";
      });
    }
  }

  // Add loading animation to page
  function addPageLoadingAnimation() {
    const hero = document.querySelector('.hero');
    const navbar = document.querySelector('.navbar');
    
    if (hero) {
      hero.style.opacity = '0';
      hero.style.transform = 'translateY(30px)';
      
      setTimeout(() => {
        hero.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        hero.style.opacity = '1';
        hero.style.transform = 'translateY(0)';
      }, 100);
    }
    
    if (navbar) {
      navbar.style.transform = 'translateY(-100%)';
      setTimeout(() => {
        navbar.style.transition = 'transform 0.6s ease';
        navbar.style.transform = 'translateY(0)';
      }, 200);
    }
  }

  // Initialize page animations
  addPageLoadingAnimation();

  // Add intersection observer for features animation
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
      }
    });
  }, observerOptions);

  // Observe all feature cards
  features.forEach(feature => {
    observer.observe(feature);
  });

  // Add CSS for fadeInUp animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);

  // Performance optimization: Debounce scroll events
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Add scroll-based navbar background opacity
  const handleScroll = debounce(() => {
    const navbar = document.querySelector('.navbar');
    const scrolled = window.pageYOffset;
    const rate = scrolled * -0.5;
    
    if (navbar) {
      const opacity = Math.min(0.95, 0.15 + scrolled / 500);
      navbar.style.background = `rgba(255, 255, 255, ${opacity})`;
    }
  }, 10);

  window.addEventListener('scroll', handleScroll);

  // Add focus trap for modals (accessibility improvement)
  function trapFocus(modal) {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements[focusableElements.length - 1];

    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusableElement) {
            lastFocusableElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusableElement) {
            firstFocusableElement.focus();
            e.preventDefault();
          }
        }
      }
    });

    // Focus first element when modal opens
    setTimeout(() => {
      if (firstFocusableElement) {
        firstFocusableElement.focus();
      }
    }, 100);
  }

  // Apply focus trap to both modals
  trapFocus(loginModal);
  trapFocus(signupModal);

  console.log("✅ LegalEase AI initialization complete");
});