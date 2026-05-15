// --- DOM SHORTCUTS -------------------------------------------------

const screens = {
  home: document.getElementById("home-screen"),
  category: document.getElementById("category-screen"),
  flashcard: document.getElementById("flashcard-screen"),
  alphabetical: document.getElementById("alphabetical-screen"),
};

const btnAlphabetical = document.getElementById("btn-alphabetical");
const btnCategories = document.getElementById("btn-categories");
const btnRandom = document.getElementById("btn-random");

const categoryListEl = document.getElementById("category-list");

const flashcardScreenBack = document.getElementById("flashcard-back");
const flashcardTitleEl = document.getElementById("flashcard-title");
const progressTextEl = document.getElementById("progress-text");
const flashcardEl = document.getElementById("flashcard");
const cardFrontEl = document.getElementById("card-front");
const cardBackEl = document.getElementById("card-back");

const toggleLanguageBtn = document.getElementById("toggle-language");
const alphabetRailEl = document.getElementById("alphabet-rail");
const termListEl = document.getElementById("term-list");

// --- NAVIGATION ----------------------------------------------------

function showScreen(id) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screens[id].classList.add("active");
}

// Home buttons
btnAlphabetical.addEventListener("click", () => {
  showScreen("alphabetical");
  buildAlphabeticalView();
});

btnCategories.addEventListener("click", () => {
  showScreen("category");
});

btnRandom.addEventListener("click", () => {
  startFlashcardMode({
    title: "Random",
    terms: shuffle([...TERMS]),
    backScreen: "home",
  });
});

// Back buttons with data-back
document.querySelectorAll("[data-back]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-back");
    showScreen(target.replace("-screen", ""));
  });
});

// Flashcard back (dynamic: either home or category)
let flashcardBackTarget = "home";
flashcardScreenBack.addEventListener("click", () => {
  showScreen(flashcardBackTarget);
});

// --- CATEGORY SCREEN -----------------------------------------------

function buildCategoryList() {
  categoryListEl.innerHTML = "";
  CATEGORIES.forEach((cat) => {
    const termsInCat = TERMS.filter((t) => t.category === cat);
    const count = termsInCat.length;

    const item = document.createElement("button");
    item.className = "category-item";
    item.disabled = count === 0;
    item.innerHTML = `
      <span>${cat}</span>
      <span>${count > 0 ? count + " terms" : "No terms yet"}</span>
    `;
    item.addEventListener("click", () => {
      if (count === 0) return;
      startFlashcardMode({
        title: cat,
        terms: termsInCat,
        backScreen: "category",
      });
    });

    categoryListEl.appendChild(item);
  });
}

buildCategoryList();

// --- FLASHCARD MODE -----------------------------------------------

let currentDeck = [];
let currentIndex = 0;
let isFlipped = false;

function startFlashcardMode({ title, terms, backScreen }) {
  currentDeck = terms;
  currentIndex = 0;
  isFlipped = false;
  flashcardBackTarget = backScreen;

  flashcardTitleEl.textContent = title;
  updateFlashcard();
  showScreen("flashcard");
}

function updateFlashcard() {
  if (currentDeck.length === 0) {
    cardFrontEl.textContent = "No terms.";
    cardBackEl.textContent = "";
    progressTextEl.textContent = "";
    return;
  }

  const term = currentDeck[currentIndex];
  // Randomize starting side
  const startWithKannada = Math.random() < 0.5;

  if (startWithKannada) {
    cardFrontEl.textContent = term.kn;
    cardBackEl.textContent = term.en;
  } else {
    cardFrontEl.textContent = term.en;
    cardBackEl.textContent = term.kn;
  }

  progressTextEl.textContent = `${currentIndex + 1} of ${currentDeck.length}`;
  flashcardEl.classList.remove("flipped");
  isFlipped = false;
}

// Tap behavior: first tap flips, second tap goes to next
flashcardEl.addEventListener("click", () => {
  if (!isFlipped) {
    // First tap → flip to Kannada
    flashcardEl.classList.add("flipped");
    isFlipped = true;
  } else {
    // Second tap → go to next card
    isFlipped = false;

    // 1. Remove flip immediately
    flashcardEl.classList.remove("flipped");

    // 2. Wait for the CSS to apply BEFORE changing text
    setTimeout(() => {
      currentIndex++;
      if (currentIndex >= currentDeck.length) {
        currentIndex = 0;
      }
      updateFlashcard();
    }, 150); // 100–200ms works well
  }
});

// --- ALPHABETICAL VIEW --------------------------------------------

let alphabeticalLanguage = "en";
let observerPaused = false;
let alphabeticalObserver = null;

toggleLanguageBtn.addEventListener("click", () => {
  alphabeticalLanguage = alphabeticalLanguage === "en" ? "kn" : "en";
  toggleLanguageBtn.textContent =
    alphabeticalLanguage === "en" ? "Show: Kannada" : "Show: English";
  buildAlphabeticalView();
});

function buildAlphabeticalView() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // Build alphabet rail
  alphabetRailEl.innerHTML = "";
  letters.forEach((letter) => {
    const btn = document.createElement("button");
    btn.className = "alphabet-letter";
    btn.textContent = letter;
    btn.addEventListener("click", () => scrollToLetter(letter));
    alphabetRailEl.appendChild(btn);
  });

  // Group terms
  const grouped = {};
  TERMS.forEach((term) => {
    const word = alphabeticalLanguage === "en" ? term.en : term.kn;
    const first = word[0].toUpperCase();
    if (!grouped[first]) grouped[first] = [];
    grouped[first].push(term);
  });

  // Sort groups
  Object.keys(grouped).forEach((letter) => {
    grouped[letter].sort((a, b) => {
      const aWord = alphabeticalLanguage === "en" ? a.en : a.kn;
      const bWord = alphabeticalLanguage === "en" ? b.en : b.kn;
      return aWord.localeCompare(bWord);
    });
  });

  // Build list
  termListEl.innerHTML = "";
  letters.forEach((letter) => {
    const section = document.createElement("div");
    section.className = "term-section";
    section.id = `letter-${letter}`;

    const header = document.createElement("div");
    header.className = "term-section-header";
    header.textContent = letter;
    section.appendChild(header);

    const terms = grouped[letter] || [];
    terms.forEach((term) => {
      const item = document.createElement("div");
      item.className = "term-item";

      const main = document.createElement("div");
      main.className = "term-text-main";
      main.textContent = alphabeticalLanguage === "en" ? term.en : term.kn;

      const sub = document.createElement("div");
      sub.className = "term-text-sub";
      sub.textContent = alphabeticalLanguage === "en" ? term.kn : term.en;

      item.appendChild(main);
      item.appendChild(sub);
      section.appendChild(item);
    });

    termListEl.appendChild(section);
  });

  setupLetterHighlighting();

  setTimeout(() => {
    scrollToLetter("A");
  }, 50);

  // Force highlight A on load
  highlightLetter("A");
}

function scrollToLetter(letter) {
  const section = document.getElementById(`letter-${letter}`);
  if (!section) return;

  const containerTop = termListEl.getBoundingClientRect().top;
  const sectionTop = section.getBoundingClientRect().top;

  const offset = sectionTop - containerTop + termListEl.scrollTop;

  termListEl.scrollTo({
    top: offset,
    behavior: "smooth",
  });

  highlightLetter(letter);
  temporarilyDisableObserver();
}

function highlightLetter(letter) {
  alphabetRailEl.querySelectorAll(".alphabet-letter").forEach((btn) => {
    btn.classList.toggle("active", btn.textContent === letter);
  });
}

function temporarilyDisableObserver() {
  observerPaused = true;
  setTimeout(() => (observerPaused = false), 600);
}

function setupLetterHighlighting() {
  const sections = Array.from(termListEl.querySelectorAll(".term-section"));
  const letterButtons = Array.from(
    alphabetRailEl.querySelectorAll(".alphabet-letter"),
  );

  if (alphabeticalObserver) alphabeticalObserver.disconnect();

  alphabeticalObserver = new IntersectionObserver(
    (entries) => {
      if (observerPaused) return;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const letter = entry.target.id.split("-")[1];
          highlightLetter(letter);
        }
      });
    },
    {
      root: termListEl,
      threshold: 0.4,
    },
  );

  // Delay so layout stabilizes (fixes Z highlight)
  setTimeout(() => {
    sections.forEach((sec) => alphabeticalObserver.observe(sec));
  }, 200);
}

// --- UTILS ---------------------------------------------------------

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
