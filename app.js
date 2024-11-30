document.addEventListener('DOMContentLoaded', () => {
  const booksContainer = document.getElementById('books');
  const searchInput = document.getElementById('search');
  const resultCount = document.getElementById('result-count');
  const bibleData = [];

  const bookNames = {
    1: 'Genesis', 2: 'Exodus', 3: 'Leviticus', 4: 'Numbers', 5: 'Deuteronomy',
    6: 'Joshua', 7: 'Judges', 8: 'Ruth', 9: '1 Samuel', 10: '2 Samuel',
    11: '1 Kings', 12: '2 Kings', 13: '1 Chronicles', 14: '2 Chronicles',
    15: 'Ezra', 16: 'Nehemiah', 17: 'Esther', 18: 'Job', 19: 'Psalms',
    20: 'Proverbs', 21: 'Ecclesiastes', 22: 'Song of Solomon', 23: 'Isaiah',
    24: 'Jeremiah', 25: 'Lamentations', 26: 'Ezekiel', 27: 'Daniel', 28: 'Hosea',
    29: 'Joel', 30: 'Amos', 31: 'Obadiah', 32: 'Jonah', 33: 'Micah',
    34: 'Nahum', 35: 'Habakkuk', 36: 'Zephaniah', 37: 'Haggai', 38: 'Zechariah',
    39: 'Malachi', 40: 'Matthew', 41: 'Mark', 42: 'Luke', 43: 'John',
    44: 'Acts', 45: 'Romans', 46: '1 Corinthians', 47: '2 Corinthians',
    48: 'Galatians', 49: 'Ephesians', 50: 'Philippians', 51: 'Colossians',
    52: '1 Thessalonians', 53: '2 Thessalonians', 54: '1 Timothy',
    55: '2 Timothy', 56: 'Titus', 57: 'Philemon', 58: 'Hebrews', 59: 'James',
    60: '1 Peter', 61: '2 Peter', 62: '1 John', 63: '2 John', 64: '3 John',
    65: 'Jude', 66: 'Revelation'
  };

  displayBooks();

  fetch('data/kjv.json')
    .then(response => response.json())
    .then(data => {
      bibleData.push(...data.resultset.row);
      searchInput.addEventListener('input', debounce(searchHandler, 500));
    })
    .catch(error => {
      console.error('Error fetching Bible data:', error);
      resultCount.textContent = 'Error loading data. Please try again later.';
    });

  function displayBooks() {
    booksContainer.innerHTML = '';
    for (const bookId in bookNames) {
      const bookName = bookNames[bookId];
      const bookBox = createBoxElement(bookName);
      bookBox.classList.add('book-box');
      bookBox.dataset.bookId = bookId;
      bookBox.addEventListener('click', () => toggleChapters(bookId));
      bookBox.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        displayBooks();
      });
      addTouchListeners(bookBox);
      booksContainer.appendChild(bookBox);
    }
  }

  function applyUserSelectNone(element) {
    element.style.webkitUserSelect = 'none';
    element.style.userSelect = 'none';
  }

  function addTouchListeners(element) {
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    element.addEventListener('click', handleClick, { passive: false });

    element.addEventListener('dblclick', (e) => {
      if (e.target.classList.contains('verse-box')) {
        const verseText = e.target.innerText;
        const parts = verseText.split(/\n\n|\n(?!\d)/);
        const text = parts.slice(0, -1).join('\n');
        const reference = parts.slice(-1)[0];

        const formattedText = `${text}\n— ${reference.trim()}`;

        navigator.clipboard.writeText(formattedText)
          .then(() => alert('Verse copied to clipboard!'))
          .catch(err => console.error('Error copying verse:', err));
      }
    });
  }

  let startX, startY, touchStartTime;
  let touchTimer;

  function handleTouchStart(e) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    touchStartTime = new Date().getTime();
    touchTimer = setTimeout(() => {
      handleSingleClick(e.target);
    }, 500);
  }

  function handleTouchEnd(e) {
    clearTimeout(touchTimer);
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = endX - startX;
    const diffY = endY - startY;
    if (Math.abs(diffX) > Math.abs(diffY) && diffX < -50) {
      const target = e.target;
      if (target.classList.contains('verse-box')) {
        const bookId = target.dataset.bookId;
        const chapter = target.dataset.chapter;
        toggleChapters(bookId);
      } else if (target.classList.contains('chapter-box')) {
        const bookId = target.dataset.bookId;
        displayBooks();
      }
    }
  }

  function handleClick(e) {
    const target = e.target;
    if (target.classList.contains('verse-box')) {
      handleSingleClick(target);
    }
  }

  function handleSingleClick(target) {
    // Removed the single-click functionality for share dialog as requested
  }

  function toggleChapters(bookId) {
    booksContainer.innerHTML = '';
    const chapters = getChaptersByBookId(bookId);
    chapters.forEach(chapter => {
      const chapterBox = createBoxElement(`${bookNames[bookId]} ${chapter}`);
      chapterBox.classList.add('chapter-box');
      applyUserSelectNone(chapterBox);
      addTouchListeners(chapterBox);
      chapterBox.dataset.chapter = chapter;
      chapterBox.dataset.bookId = bookId;
      chapterBox.addEventListener('click', () => toggleVerses(bookId, chapter));
      chapterBox.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        displayBooks();
      });
      booksContainer.appendChild(chapterBox);
    });
  }

  function getChaptersByBookId(bookId) {
    const chapters = new Set();
    bibleData.forEach(verse => {
      if (verse.field[1] === parseInt(bookId)) {
        chapters.add(verse.field[2]);
      }
    });
    return Array.from(chapters).sort((a, b) => a - b);
  }

  function toggleVerses(bookId, chapter, targetVerseNumber = null) {
    booksContainer.innerHTML = '';
    const verses = getVersesByBookAndChapter(bookId, chapter);
    verses.forEach(verse => {
      const verseNumber = verse.field[3];
      const verseText = `${verse.field[4]}<br>${bookNames[bookId]} ${chapter}:${verseNumber}`;

      const verseBox = createBoxElement(verseText);
      verseBox.classList.add('verse-box');
      verseBox.dataset.verse = verseNumber;
      verseBox.dataset.bookId = bookId;
      verseBox.dataset.chapter = chapter;
      verseBox.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        toggleChapters(bookId);
      });
      addTouchListeners(verseBox);
      booksContainer.appendChild(verseBox);

      if (targetVerseNumber && parseInt(verseNumber) === parseInt(targetVerseNumber)) {
        setTimeout(() => {
          const verseBoxRect = verseBox.getBoundingClientRect();
          const scrollTop = window.scrollY || window.pageYOffset;
          const offsetTop = verseBoxRect.top + scrollTop - 20;
          window.scrollTo({ top: offsetTop, behavior: 'smooth' });

          const highlightSpan = document.createElement('span');
          highlightSpan.className = 'highlight';
          highlightSpan.textContent = verse.field[4];
          const verseBoxContent = verseBox.innerHTML.split('<br>')[1];
          verseBox.innerHTML = `${highlightSpan.outerHTML}<br>${verseBoxContent}`;
        }, 100);
      }
    });
  }

  function getVersesByBookAndChapter(bookId, chapter) {
    return bibleData.filter(verse => verse.field[1] === parseInt(bookId) && verse.field[2] === parseInt(chapter));
  }

  function searchHandler() {
    const searchTerm = searchInput.value.toLowerCase().trim();

    if (searchTerm.length < 4 && !searchTerm.includes('*') && !searchTerm.includes('?')) {
      booksContainer.innerHTML = '';
      resultCount.textContent = 'Type in at least 4 letters to begin search.';
      return;
    }

    booksContainer.innerHTML = '';

    // Allow wildcard support by converting * and ? into regular expressions
    const regexSearchTerm = buildSearchPattern(searchTerm);

    const maxResults = 100;
    setTimeout(() => {
      const results = bibleData.filter(verse => {
        return new RegExp(regexSearchTerm, 'i').test(verse.field[4]);
      });

      const limitedResults = results.slice(0, maxResults);
      resultCount.textContent = `Results: ${limitedResults.length}`;

      if (limitedResults.length === 0) {
        resultCount.textContent = 'No results found.';
      }

      limitedResults.forEach(result => {
        const bookId = result.field[1];
        const bookName = bookNames[bookId];
        const chapter = result.field[2];
        const verseNumber = result.field[3];
        const verseText = result.field[4].replace(new RegExp(`(${regexSearchTerm})`, 'gi'), '<span class="highlight">$1</span>');
        const fullText = `${verseText}<br>${bookName} ${chapter}:${verseNumber}`;
        const resultBox = createBoxElement(fullText);
        resultBox.classList.add('result-box');
        resultBox.addEventListener('click', () => {
          toggleChapters(bookId);
          toggleVerses(bookId, chapter, verseNumber);
          searchInput.value = '';
          resultCount.textContent = '';
        });
        booksContainer.appendChild(resultBox);
      });
    }, 500);
  }

  function buildSearchPattern(searchTerm) {
    let pattern = searchTerm
      .replace(/\*/g, '.*')  // '*' matches any number of characters
      .replace(/\?/g, '.')   // '?' matches exactly one character
      .replace(/[.*+?^=!:${}()|\[\]\/\\]/g, '\\$&'); // Escape regex special chars

    return pattern;
  }

  function createBoxElement(text) {
    const box = document.createElement('div');
    box.className = 'box';
    box.innerHTML = text;
    return box;
  }

  function debounce(func, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  }
});
