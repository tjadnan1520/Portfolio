/* =============================================================
   Tarek Jamil Adnan — Portfolio interactions
   Vanilla JS, no dependencies. Every module is defensive so a
   missing element never throws.
   ============================================================= */
(function () {
    "use strict";

    var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
    var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var onFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    /* ---------------------------------------------------------
       1. Stagger delays for grouped reveals
       --------------------------------------------------------- */
    $$(".reveal-group").forEach(function (group) {
        $$(":scope > .reveal", group).forEach(function (el, i) {
            el.style.setProperty("--d", Math.min(i, 8) * 75 + "ms");
        });
    });

    /* ---------------------------------------------------------
       2. Scroll reveal
       --------------------------------------------------------- */
    var revealTargets = $$(".reveal");

    if (reduceMotion || !("IntersectionObserver" in window)) {
        revealTargets.forEach(function (el) { el.classList.add("is-in"); });
        $$(".codewin-body .cl").forEach(function (el) { el.classList.add("is-in"); });
    } else {
        var revealObserver = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-in");
                obs.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -70px 0px" });

        revealTargets.forEach(function (el) { revealObserver.observe(el); });
    }

    /* ---------------------------------------------------------
       3. Code window typing reveal
       --------------------------------------------------------- */
    var codeLines = $$(".codewin-body .cl");
    codeLines.forEach(function (el, i) { el.style.setProperty("--d", 260 + i * 110 + "ms"); });

    if (codeLines.length) {
        if (reduceMotion || !("IntersectionObserver" in window)) {
            codeLines.forEach(function (el) { el.classList.add("is-in"); });
        } else {
            var codeObserver = new IntersectionObserver(function (entries, obs) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    codeLines.forEach(function (el) { el.classList.add("is-in"); });
                    obs.disconnect();
                });
            }, { threshold: 0.2 });
            codeObserver.observe(codeLines[0]);
        }
    }

    /* ---------------------------------------------------------
       4. Number counters
       --------------------------------------------------------- */
    function animateCount(el) {
        var target = parseFloat(el.dataset.count);
        var decimals = parseInt(el.dataset.decimals || "0", 10);
        if (isNaN(target)) return;

        if (reduceMotion) { el.textContent = target.toFixed(decimals); return; }

        var duration = 1400;
        var start = null;

        function step(ts) {
            if (start === null) start = ts;
            var p = Math.min((ts - start) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = (target * eased).toFixed(decimals);
            if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    var counters = $$("[data-count]");
    if (counters.length) {
        if (!("IntersectionObserver" in window)) {
            counters.forEach(animateCount);
        } else {
            var countObserver = new IntersectionObserver(function (entries, obs) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    animateCount(entry.target);
                    obs.unobserve(entry.target);
                });
            }, { threshold: 0.6 });
            counters.forEach(function (el) { countObserver.observe(el); });
        }
    }

    /* ---------------------------------------------------------
       5. Rotating role text
       --------------------------------------------------------- */
    var roleEl = $("#roleText");
    if (roleEl && !reduceMotion) {
        var roles = [
            "Full-Stack Developer",
            "AI/ML Enthusiast",
            "Problem Solver",
            "IoT Tinkerer"
        ];
        var roleIndex = 0;
        var roleChar = 0;
        var deleting = false;

        setInterval(function () {
            var word = roles[roleIndex];
            roleChar += deleting ? -1 : 1;
            roleEl.textContent = word.slice(0, roleChar);

            var atEnd = roleChar === word.length;
            var atStart = roleChar === 0;

            if (atEnd && !deleting) {
                deleting = true;
                setTimeout(function () { deleting = false; }, 1700);
            } else if (atStart && deleting) {
                deleting = false;
                roleIndex = (roleIndex + 1) % roles.length;
            }
        }, 85);
    }

    /* ---------------------------------------------------------
       6. Navigation: scrolled state + progress bar
       --------------------------------------------------------- */
    var navbar = $("#navbar");
    var progress = $("#navProgress");
    var toTop = $("#toTop");
    var lastY = -1;

    function onScroll() {
        var y = window.scrollY || window.pageYOffset;
        if (y === lastY) return;
        lastY = y;

        if (navbar) navbar.classList.toggle("is-scrolled", y > 12);

        if (progress) {
            var docH = document.documentElement.scrollHeight - window.innerHeight;
            progress.style.transform = "scaleX(" + (docH > 0 ? Math.min(y / docH, 1) : 0) + ")";
        }

        if (toTop) toTop.classList.toggle("is-visible", y > 600);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();

    if (toTop) {
        toTop.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        });
    }

    /* ---------------------------------------------------------
       7. Smooth in-page anchors (with sticky-nav offset)
       --------------------------------------------------------- */
    $$('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener("click", function (e) {
            var id = this.getAttribute("href");
            if (!id || id === "#") return;

            var target = document.getElementById(id.slice(1));
            if (!target) return;

            e.preventDefault();
            closeDrawer();

            var navH = navbar ? navbar.offsetHeight : 0;
            var top = target.getBoundingClientRect().top + window.scrollY - navH - 18;

            window.scrollTo({ top: Math.max(top, 0), behavior: reduceMotion ? "auto" : "smooth" });
            history.replaceState(null, "", id);
        });
    });

    /* ---------------------------------------------------------
       8. Mobile drawer
       --------------------------------------------------------- */
    var toggle = $("#navToggle");
    var drawer = $("#navDrawer");
    var drawerBackdrop = $("#navBackdrop");

    function openDrawer() {
        if (!drawer || !toggle) return;
        drawer.classList.add("is-open");
        drawer.setAttribute("aria-hidden", "false");
        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("aria-label", "Close menu");
        document.body.classList.add("no-scroll");
        if (drawerBackdrop) {
            drawerBackdrop.hidden = false;
            requestAnimationFrame(function () { drawerBackdrop.classList.add("is-open"); });
        }
    }

    function closeDrawer() {
        if (!drawer || !drawer.classList.contains("is-open")) return;
        drawer.classList.remove("is-open");
        drawer.setAttribute("aria-hidden", "true");
        if (toggle) {
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-label", "Open menu");
        }
        document.body.classList.remove("no-scroll");
        if (drawerBackdrop) {
            drawerBackdrop.classList.remove("is-open");
            setTimeout(function () { drawerBackdrop.hidden = true; }, 350);
        }
    }

    if (toggle) toggle.addEventListener("click", function () {
        if (drawer && drawer.classList.contains("is-open")) closeDrawer();
        else openDrawer();
    });

    if (drawerBackdrop) drawerBackdrop.addEventListener("click", closeDrawer);

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeDrawer();
    });

    window.addEventListener("resize", function () {
        if (window.innerWidth > 1000) closeDrawer();
    });

    /* ---------------------------------------------------------
       9. Active nav link
       Anchors on the homepage, filename match elsewhere.
       --------------------------------------------------------- */
    var navLinks = $$(".nav-links a");
    var drawerLinks = $$(".nav-drawer a");
    var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    var isHome = page === "" || page === "index.html" || page === "index.htm";

    if (!isHome && navLinks.length) {
        navLinks.concat(drawerLinks).forEach(function (link) {
            var href = (link.getAttribute("href") || "").toLowerCase();
            var match = href === page || (href === "index.html" && isHome);
            link.classList.toggle("active", match);
            if (match) link.setAttribute("aria-current", "page");
        });
    }

    /* Scroll spy — only meaningful on the single-page homepage */
    if (isHome && "IntersectionObserver" in window) {
        var sections = $$("main section[id]");
        var spyMap = {};
        navLinks.forEach(function (link) {
            var id = (link.getAttribute("href") || "").slice(1);
            if (id) spyMap[id] = link;
        });

        var currentId = null;
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) currentId = entry.target.id;
            });
            navLinks.forEach(function (l) { l.classList.remove("active"); });
            drawerLinks.forEach(function (l) { l.classList.remove("active"); });
            if (currentId && spyMap[currentId]) {
                spyMap[currentId].classList.add("active");
                var mirror = drawerLinks.filter(function (l) {
                    return l.getAttribute("href") === "#" + currentId;
                })[0];
                if (mirror) mirror.classList.add("active");
            }
        }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

        sections.forEach(function (s) { spy.observe(s); });
    }

    /* ---------------------------------------------------------
       10. Card spotlight (cursor-tracked glow)
       --------------------------------------------------------- */
    if (onFinePointer) {
        $$(".spot").forEach(function (card) {
            card.addEventListener("pointermove", function (e) {
                var rect = this.getBoundingClientRect();
                this.style.setProperty("--mx", ((e.clientX - rect.left) / rect.width) * 100 + "%");
                this.style.setProperty("--my", ((e.clientY - rect.top) / rect.height) * 100 + "%");
            });
        });
    }

    /* ---------------------------------------------------------
       11. Copy to clipboard + toast
       --------------------------------------------------------- */
    var toast = $("#toast");
    var toastMsg = $("#toastMsg");
    var toastTimer;

    function showToast(message) {
        if (!toast) return;
        if (toastMsg) toastMsg.textContent = message;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toast.classList.remove("is-visible"); }, 2200);
    }

    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        }
        return new Promise(function (resolve, reject) {
            var ta = document.createElement("textarea");
            ta.value = text;
            ta.setAttribute("readonly", "");
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand("copy"); resolve(); }
            catch (err) { reject(err); }
            finally { document.body.removeChild(ta); }
        });
    }

    $$("[data-copy]").forEach(function (el) {
        el.addEventListener("click", function (e) {
            var value = this.dataset.copy;
            if (!value) return;
            e.preventDefault();
            e.stopPropagation();
            copyText(value).then(
                function () { showToast(value + " copied to clipboard"); },
                function () { showToast("Couldn't copy automatically"); }
            );
        });
        if (el.getAttribute("role") === "button") {
            el.addEventListener("keydown", function (e) {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    el.click();
                }
            });
        }
    });

    /* ---------------------------------------------------------
       12. Project filtering (projects.html)
       --------------------------------------------------------- */
    var filterBar = $("#filterBar");
    var projectGrid = $("#projectGrid");
    var filterEmpty = $("#filterEmpty");

    if (filterBar && projectGrid) {
        var cards = $$(".project-card", projectGrid);
        var buttons = $$(".filter-btn", filterBar);

        buttons.forEach(function (btn) {
            btn.addEventListener("click", function () {
                var want = btn.dataset.filter;

                buttons.forEach(function (b) {
                    var active = b === btn;
                    b.classList.toggle("is-active", active);
                    b.setAttribute("aria-pressed", String(active));
                });

                var shown = 0;
                cards.forEach(function (card) {
                    var match = want === "all" || card.dataset.cat === want;
                    card.hidden = !match;
                    if (!match) return;

                    shown++;
                    card.classList.add("is-in");
                    if (!reduceMotion) {
                        card.style.animation = "none";
                        void card.offsetWidth;
                        card.style.animation = "cardIn .45s cubic-bezier(.16,1,.3,1) both";
                    }
                });

                if (filterEmpty) filterEmpty.hidden = shown !== 0;
            });
        });
    }

    /* ---------------------------------------------------------
       13. Footer year
       --------------------------------------------------------- */
    var year = $("#year");
    if (year) year.textContent = new Date().getFullYear();
})();
