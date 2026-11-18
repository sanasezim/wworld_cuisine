"use strict";

const USER_KEY = "wc_demo_user";
const SESSION_KEY = "wc_demo_session";
const THEME_KEY = "theme";

$(function () {
    initTheme();
    initNavigation();
    initHome();
    initReadMore();
    initRatings();
    initSearch();
    initRecipes();
    initRestaurants();
    initForms();
    initProfile();
    initMealAPI();
    initLazyImages();
    initScroll();
});

// ==========================================
// 1. HELPERS
// ==========================================

function getStoredValue(key) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function saveStoredValue(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch {
        return false;
    }
}

function readStorage(key) {
    try {
        return JSON.parse(getStoredValue(key) || "null");
    } catch {
        return null;
    }
}

function notifyUser(message) {
    const notification = $("#notification");

    if (!notification.length) return;

    notification
        .stop(true, true)
        .text(message)
        .fadeIn(150)
        .delay(2500)
        .fadeOut(300);
}

function showFormStatus(form, message, isError = false) {
    const status = $(form).find(".form-success");

    status
        .toggleClass("form-error", isError)
        .text(message)
        .css("color", isError
            ? (document.body.classList.contains("night")
                ? "#ff9999" : "#b42318")
            : "");
}

// ==========================================
// 2. LIGHT / DARK MODE
// ==========================================

function initTheme() {
    const savedTheme = getStoredValue(THEME_KEY);

    $("body").toggleClass(
        "night",
        savedTheme === "night"
    );

    function updateThemeButton() {
        const isNight = $("body").hasClass("night");

        $("#themeBtn")
            .text(isNight ? "Day mode" : "Night mode")
            .attr("aria-pressed", String(isNight));
    }

    updateThemeButton();

    $("#themeBtn").on("click", function () {
        $("body").toggleClass("night");

        // Remove custom background if it was changed
        document.body.style.backgroundColor = "";

        const theme = $("body").hasClass("night")
            ? "night"
            : "day";

        saveStoredValue(THEME_KEY, theme);
        updateThemeButton();
    });
}

// ==========================================
// 3. NAVIGATION
// ==========================================

function initNavigation() {
    const nav = $(".navbar-nav");

    // Hide Log In from the top menu
    nav.find('a[href="login.html"]').closest("li").remove();

    // Show Profile after login
    const user = readStorage(USER_KEY);
    const session = getStoredValue(SESSION_KEY);

    if (
        user &&
        session === user.email &&
        !nav.find('a[href="profile.html"]').length
    ) {
        nav.append(
            '<li class="nav-item">' +
            '<a class="nav-link" href="profile.html">Profile</a>' +
            '</li>'
        );
    }

    // Arrow key navigation across the whole page
    document.addEventListener("keydown", function (event) {
        const nextKeys = ["ArrowDown", "ArrowRight"];
        const previousKeys = ["ArrowUp", "ArrowLeft"];

        if (
            !nextKeys.includes(event.key) &&
            !previousKeys.includes(event.key)
        ) return;

        if (event.ctrlKey || event.metaKey || event.altKey) return;

        // Preserve normal arrow behavior inside form fields
        if (
            event.target.closest(
                "input, textarea, select, [contenteditable='true']"
            )
        ) return;

        // Only focus visible interactive elements
        const popup = document.querySelector("#popupOverlay.show");
        const container = popup || document;

        const elements = Array.from(
            container.querySelectorAll(
                "a[href], button, input, select, textarea, " +
                "[tabindex]:not([tabindex='-1'])"
            )
        ).filter(element => {
            return (
                !element.disabled &&
                element.tabIndex >= 0 &&
                element.getClientRects().length > 0 &&
                getComputedStyle(element).visibility !== "hidden" &&
                !element.closest("[inert], [aria-hidden='true']")
            );
        });

        if (!elements.length) return;

        event.preventDefault();

        const current = elements.indexOf(document.activeElement);
        const forward = nextKeys.includes(event.key);

        let next;

        if (current === -1) {
            next = forward ? 0 : elements.length - 1;
        } else {
            next = forward
                ? (current + 1) % elements.length
                : (current - 1 + elements.length) % elements.length;
        }

        elements[next].focus({ preventScroll: true });

        elements[next].scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
    });
}


// ==========================================
// 4. HOME PAGE
// ==========================================

function initHome() {

    // Current Date and Time
    function updateTime() {
        const element = document.getElementById("datetime");

        if (!element) return;

        element.textContent = new Date().toLocaleString(
            "en-US",
            {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
            }
        );
    }

    updateTime();

    if ($("#datetime").length) {
        setInterval(updateTime, 1000);
    }

    // Change background
    let colorIndex = 0;

    $("#colorBtn").on("click", function () {
        const colors = $("body").hasClass("night")
            ? ["#15161a", "#292129", "#172a24"]
            : ["#fde8e0", "#e3f2e1", "#e0ecfb"];

        document.body.style.backgroundColor =
            colors[colorIndex % colors.length];

        colorIndex++;
    });

    // FAQ accordion
    $(".faq-question").on("click", function () {
        const open =
            $(this).attr("aria-expanded") !== "true";

        $(this).attr(
            "aria-expanded",
            String(open)
        );

        $(this)
            .next(".faq-answer")
            .stop(true, true)
            .slideToggle(200);
    });

    // Subscription popup
    const overlay = $("#popupOverlay");

    function closePopup() {
        overlay.removeClass("show");
        $("body").css("overflow", "");
        $("#openPopup").trigger("focus");
    }

    $("#openPopup").on("click", function () {
        overlay.addClass("show");
        $("body").css("overflow", "hidden");

        $("#subEmail").trigger("focus");
    });

    $("#closePopup").on("click", closePopup);

    overlay.on("click", function (event) {
        if (event.target === this) {
            closePopup();
        }
    });

    $(document).on("keydown", function (event) {
        if (!overlay.hasClass("show")) return;

        if (event.key === "Escape") {
            closePopup();
            return;
        }

        if (event.key !== "Tab") return;

        const items = overlay.find(
            "button:enabled, input:enabled"
        ).get();

        if (!items.length) return;

        const first = items[0];
        const last = items[items.length - 1];

        if (
            event.shiftKey &&
            document.activeElement === first
        ) {
            event.preventDefault();
            last.focus();
        } else if (
            !event.shiftKey &&
            document.activeElement === last
        ) {
            event.preventDefault();
            first.focus();
        }
    });
}

// ==========================================
// 5. COUNTRIES - READ MORE
// ==========================================

function initReadMore() {
    $(".read-more-btn").on("click", function () {
        const details = $(this).next(".more-text");
        const open = !details.is(":visible");

        details
            .stop(true, true)
            .slideToggle(200);

        $(this)
            .text(open ? "Read less" : "Read more")
            .attr("aria-expanded", String(open));
    });
}

// ==========================================
// 6. DISH RATINGS
// ==========================================

function initRatings() {
    $(".gallery-item").each(function () {
        const card = $(this);

        if (card.find(".rating").length) return;

        const name = card
            .find("figcaption strong")
            .text()
            .trim();

        const key = "rating_" + name;
        const rating = $('<div class="rating" role="group"></div>');
        const label = $('<span class="rating-value"></span>');

        const saved = Number(getStoredValue(key)) || 0;

        function updateStars(value) {
            rating.find(".star").each(function () {
                const number = Number(this.dataset.value);

                $(this)
                    .toggleClass("active", number <= value)
                    .attr(
                        "aria-pressed",
                        String(number === value)
                    );
            });

            label.text(value ? `${value}/5` : "Rate it");
        }

        for (let i = 1; i <= 5; i++) {
            $("<button>", {
                type: "button",
                class: "star",
                text: "★"
            })
                .attr("data-value", i)
                .attr(
                    "aria-label",
                    `Rate ${name} ${i} out of 5`
                )
                .on("click", function () {
                    saveStoredValue(key, String(i));

                    updateStars(i);

                    card.removeClass("pop");
                    void card[0].offsetWidth;
                    card.addClass("pop");

                    notifyUser(
                        `You rated ${name} ${i}/5`
                    );
                })
                .appendTo(rating);
        }

        rating.append(label);
        card.append(rating);

        updateStars(saved);
    });
}

// ==========================================
// 7. LIVE SEARCH AND AUTOCOMPLETE
// ==========================================

function initSearch() {
    const input = $("#dishSearch");

    if (!input.length) return;

    const cards = $(".gallery-item");
    const suggestions = $("#searchSuggestions");

    const names = cards.map(function () {
        return $(this)
            .find("figcaption strong")
            .text()
            .trim();
    }).get();

    function closeSuggestions() {
        suggestions.prop("hidden", true);

        input.attr(
            "aria-expanded",
            "false"
        );
    }

    function highlight(element, query) {
        if (!element.dataset.original) {
            element.dataset.original = element.textContent;
        }

        const original = element.dataset.original;
        const index = query
            ? original.toLowerCase().indexOf(query)
            : -1;

        element.replaceChildren();

        if (index === -1) {
            element.textContent = original;
            return;
        }

        const mark = document.createElement("mark");

        mark.textContent = original.slice(
            index,
            index + query.length
        );

        element.append(
            document.createTextNode(
                original.slice(0, index)
            ),
            mark,
            document.createTextNode(
                original.slice(index + query.length)
            )
        );
    }

    function search(showSuggestions = true) {
        const query = String(input.val())
            .trim()
            .toLowerCase();

        let visible = 0;

        cards.each(function () {
            const card = $(this);

            const nameElement =
                card.find("figcaption strong")[0];

            const countryElement =
                card.find("figcaption span")[0];

            if (!nameElement || !countryElement) return;

            const name =
                nameElement.dataset.original ||
                nameElement.textContent;

            const country =
                countryElement.dataset.original ||
                countryElement.textContent;

            const match = (
                name + " " + country
            ).toLowerCase().includes(query);

            card.toggle(match);

            if (match) visible++;

            highlight(nameElement, query);
            highlight(countryElement, query);
        });

        $("#searchCount").text(
            visible
                ? `Showing ${visible} of ${cards.length} dishes`
                : "No matching dishes found. Try another name or country."
        );

        suggestions.empty();

        if (showSuggestions && query) {
            names
                .filter(name =>
                    name.toLowerCase().includes(query)
                )
                .slice(0, 7)
                .forEach(name => {
                    const item = $("<li>");

                    $("<button>", {
                        type: "button",
                        text: name
                    })
                        .on("click", function () {
                            input.val(name);
                            search(false);
                            input.trigger("focus");
                        })
                        .appendTo(item);

                    suggestions.append(item);
                });
        }

        const hasSuggestions =
            suggestions.children().length > 0;

        suggestions.prop(
            "hidden",
            !hasSuggestions
        );

        input.attr(
            "aria-expanded",
            String(hasSuggestions)
        );
    }

    input.on("input", function () {
        search(true);
    });

    $("#clearSearch").on("click", function () {
        input.val("");
        search(false);
        input.trigger("focus");
    });

    $(".search-panel").on("keydown", function (event) {
        if (event.key === "Escape") {
            closeSuggestions();
            input.trigger("focus");
            return;
        }

        if (
            event.key !== "ArrowDown" &&
            event.key !== "ArrowUp"
        ) {
            return;
        }

        if (suggestions.prop("hidden")) return;

        const buttons = suggestions.find("button").get();

        if (!buttons.length) return;

        event.preventDefault();

        const current =
            buttons.indexOf(document.activeElement);

        const next = event.key === "ArrowDown"
            ? current + 1
            : current - 1;

        buttons[
            (next + buttons.length) % buttons.length
        ].focus();
    });

    $(document).on("click", function (event) {
        if (
            !$(event.target).closest(".search-panel").length
        ) {
            closeSuggestions();
        }
    });

    search(false);
}

// ==========================================
// 8. RECIPE FILTERS AND COPY
// ==========================================

function initRecipes() {

    function filterRecipes(category) {
        $(".filter-btn")
            .removeClass("active")
            .filter(function () {
                return this.dataset.filter === category;
            })
            .addClass("active");

        let count = 0;

        $(".recipe-box").each(function () {
            const match =
                category === "all" ||
                this.dataset.category === category;

            $(this).toggle(match);

            if (match) count++;
        });

        $("#recipeCount").text(
            `Showing ${count} of ${$(".recipe-box").length} recipes`
        );
    }

    $(".filter-btn").on("click", function () {
        filterRecipes(this.dataset.filter);
    });

    if ($(".filter-btn").length) {
        filterRecipes("all");
    }

    $(".copy-recipe").on("click", async function () {
        const button = $(this);
        const card = button.closest(".recipe-box");

        const ingredients = card.find("ul li")
            .map(function () {
                return this.textContent.trim();
            })
            .get();

        const steps = card.find("ol li")
            .map(function (index) {
                return `${index + 1}. ${this.textContent.trim()}`;
            })
            .get();

        const recipe = [
            card.find("h2").text().trim(),
            "",
            "Ingredients",
            ingredients.join("\n"),
            "",
            "Steps",
            steps.join("\n")
        ].join("\n");

        try {
            await navigator.clipboard.writeText(recipe);

            button.text("✓ Copied");

            card.find(".copy-feedback")
                .text("Copied to clipboard!");

            notifyUser("Recipe copied!");

            setTimeout(function () {
                button.text("Copy recipe");

                card.find(".copy-feedback").text("");
            }, 2000);

        } catch {
            card.find(".copy-feedback").text(
                "Clipboard access requires HTTPS or localhost."
            );
        }
    });
}

// ==========================================
// 9. RESTAURANT RATINGS
// ==========================================

function initRestaurants() {
    // Demo ratings, not actual customer reviews
    const ratings = [4.7, 4.5, 4.3, 4.6, 4.4, 4.2];

    $(".restaurant-card").each(function (index) {
        if (ratings[index] === undefined) return;

        if (
            $(this).find(".restaurant-rating").length
        ) {
            return;
        }

        $("<p>", {
            class: "restaurant-rating",
            text: `Sample rating: ${ratings[index]}/5`
        }).appendTo(
            $(this).find(".card-body")
        );
    });
}

// ==========================================
// 10. FORM VALIDATION
// ==========================================

function showError(input, message) {
    const field = $(input);

    let anchor = field;

    if (input.type === "checkbox") {
        anchor = field.closest(".form-check");
    } else if (field.closest(".input-group").length) {
        anchor = field.closest(".input-group");
    }

    let error = anchor.next(".field-error");

    if (!error.length) {
        error = $('<div class="field-error" role="alert"></div>');

        error.css({
            fontSize: "0.85rem",
            marginTop: "5px"
        });

        error.insertAfter(anchor);
    }

    error
        .text(message)
        .css(
            "color",
            document.body.classList.contains("night")
                ? "#ff9999"
                : "#b42318"
        );

    field
        .toggleClass("is-invalid", Boolean(message))
        .attr("aria-invalid", String(Boolean(message)));
}

function validateFields(form, ids) {
    let valid = true;
    let firstInvalid = null;

    const emailRule =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const passwordRule =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;

    ids.forEach(id => {
        const input = form.querySelector("#" + id);

        if (!input) {
            console.error("Missing form field:", id);
            valid = false;

            showFormStatus(
                form,
                "A required form field is missing. Please check the page.",
                true
            );

            return;
        }

        const value = input.type === "checkbox"
            ? input.checked
            : input.value.trim();

        let error = "";

        if (!value) {
            error = "This field is required.";

        } else if (
            ["email", "regEmail", "loginEmail", "subEmail"].includes(id) &&
            !emailRule.test(value)
        ) {
            error = "Please enter a valid email address.";

        } else if (
            ["phone", "regPhone"].includes(id) &&
            !/^\+?[0-9]{10,15}$/.test(
                value.replace(/[\s()-]/g, "")
            )
        ) {
            error = "Enter a valid phone number (10-15 digits).";

        } else if (
            ["regPassword", "loginPassword"].includes(id) &&
            !passwordRule.test(value)
        ) {
            error = "Password needs 8+ characters, uppercase, lowercase, number and symbol.";

        } else if (
            id === "regConfirm" &&
            value !== $("#regPassword").val()
        ) {
            error = "Passwords do not match.";

        } else if (
            id === "message" &&
            value.length < 10
        ) {
            error = "Write at least 10 characters.";
        }

        showError(input, error);

        if (error) {
            valid = false;

            if (!firstInvalid) {
                firstInvalid = input;
            }
        }
    });

    if (firstInvalid) {
        firstInvalid.focus();
    }

    return valid;
}

// ==========================================
// 11. SUBMIT ANIMATION
// ==========================================

function simulateSubmit(form, message, onComplete) {
    const button = $(form).find('[type="submit"]');

    if (button.prop("disabled")) return;

    const original = button.html();

    button
        .prop("disabled", true)
        .html(
            '<span class="loading-spinner" aria-hidden="true"></span>' +
            " Please wait..."
        );

    setTimeout(function () {
        form.reset();

        button
            .prop("disabled", false)
            .html(original);

        $(form).find(".field-error").text("");

        $(form)
            .find(".is-invalid")
            .removeClass("is-invalid")
            .attr("aria-invalid", "false");

        showFormStatus(form, message);
        notifyUser(message);

        if (typeof onComplete === "function") {
            onComplete();
        }
    }, 800);
}

// ==========================================
// 12. ALL FORMS
// ==========================================

function initForms() {

    // Disable browser validation.
    // All validation is performed by JavaScript.
    $("form").attr("novalidate", "novalidate");

    $("form").on(
        "input change",
        "input, select, textarea",
        function () {
            showError(this, "");
            showFormStatus(this.form, "");
        }
    );

    $("form").on("reset", function () {
        const form = this;

        setTimeout(function () {
            $(form).find(".field-error").text("");

            $(form)
                .find(".is-invalid")
                .removeClass("is-invalid")
                .attr("aria-invalid", "false");

            showFormStatus(form, "");
        }, 0);
    });

    // --------------------------------------
    // CONTACT FORM - TWO STEPS
    // --------------------------------------

    const contact = document.getElementById("contactForm");

    if (contact) {
        let currentStep = 1;

        function showStep(number) {
            currentStep = number;

            $(contact)
                .find(".form-step")
                .removeClass("active")
                .filter(function () {
                    return Number(this.dataset.step) === number;
                })
                .addClass("active");

            $("#stepIndicator").text(
                `Step ${number} of 2`
            );
        }

        $("#nextBtn").on("click", function () {
            const valid = validateFields(
                contact,
                ["name", "email", "phone"]
            );

            if (valid) {
                showStep(2);
            }
        });

        $("#backBtn").on("click", function () {
            showStep(1);
        });

        $(contact).on("keydown", "input", function (event) {
            if (
                event.key === "Enter" &&
                currentStep === 1
            ) {
                event.preventDefault();
                $("#nextBtn").trigger("click");
            }
        });

        $(contact).on("submit", function (event) {
            event.preventDefault();

            if (currentStep === 1) {
                $("#nextBtn").trigger("click");
                return;
            }

            // Validate Step 1 again
            const personalValid = validateFields(
                contact,
                ["name", "email", "phone"]
            );

            if (!personalValid) {
                showStep(1);
                return;
            }

            // Validate Step 2
            const detailsValid = validateFields(
                contact,
                ["cuisine", "message", "confirm"]
            );

            if (!detailsValid) return;

            simulateSubmit(
                contact,
                "Recommendation submitted in demo mode.",
                function () {
                    showStep(1);
                }
            );
        });

        $(contact).on("reset", function () {
            setTimeout(function () {
                showStep(1);
            }, 0);
        });

        showStep(1);
    }

    // --------------------------------------
    // SUBSCRIBE FORM
    // --------------------------------------

    $("#subscribeForm").on("submit", function (event) {
        event.preventDefault();

        if (!validateFields(this, ["subEmail"])) {
            return;
        }

        simulateSubmit(
            this,
            "Subscribed in demo mode!"
        );
    });

    // --------------------------------------
    // SIGN UP
    // --------------------------------------

    $("#registerForm").on("submit", function (event) {
        event.preventDefault();

        const valid = validateFields(this, [
            "regName",
            "regEmail",
            "regPhone",
            "regPassword",
            "regConfirm"
        ]);

        if (!valid) return;

        const user = {
            name: $("#regName").val().trim(),
            email: $("#regEmail").val().trim().toLowerCase(),
            phone: $("#regPhone").val().trim(),
            password: $("#regPassword").val()
        };

        // Classroom demonstration only.
        // Never use a real password here.
        const saved = saveStoredValue(
            USER_KEY,
            JSON.stringify(user)
        );

        if (!saved) {
            showFormStatus(
                this,
                "Unable to save account. Enable browser storage.",
                true
            );
            return;
        }

        // Clear previous session
        try {
            localStorage.removeItem(SESSION_KEY);
        } catch {}

        showFormStatus(
            this,
            "Account created! Redirecting to Log In..."
        );

        notifyUser("Account created successfully!");

        setTimeout(function () {
            window.location.href = "login.html";
        }, 600);
    });

    // --------------------------------------
    // LOG IN
    // --------------------------------------

    $("#loginForm").on("submit", function (event) {
        event.preventDefault();

        const valid = validateFields(this, [
            "loginEmail",
            "loginPassword"
        ]);

        if (!valid) return;

        const user = readStorage(USER_KEY);

        const email = $("#loginEmail")
            .val()
            .trim()
            .toLowerCase();

        const password = $("#loginPassword").val();

        if (
            !user ||
            user.email !== email ||
            user.password !== password
        ) {
            showFormStatus(
                this,
                "Incorrect email or password.",
                true
            );
            return;
        }

        const saved = saveStoredValue(
            SESSION_KEY,
            user.email
        );

        if (!saved) {
            showFormStatus(
                this,
                "Unable to start your session.",
                true
            );
            return;
        }

        showFormStatus(
            this,
            "Login successful!"
        );

        window.location.href = "profile.html";
    });
}

// ==========================================
// 13. PROFILE PAGE
// ==========================================

function initProfile() {
    if (!$("#profileName").length) return;

    const user = readStorage(USER_KEY);
    const session = getStoredValue(SESSION_KEY);

    if (!user || session !== user.email) {
        window.location.replace("login.html");
        return;
    }

    $("#profileName").text(user.name);
    $("#profileEmail").text(user.email);
    $("#profilePhone").text(
        user.phone || "Not provided"
    );

    $("#logoutBtn").on("click", function () {
        try {
            localStorage.removeItem(SESSION_KEY);
        } catch {}

        window.location.href = "index.html";
    });
}

// ==========================================
// 14. EXTERNAL API - THEMEALDB
// ==========================================

function initMealAPI() {
    const form = document.getElementById("mealSearchForm");

    if (!form) return;

    const results = document.getElementById("apiResults");
    const status = document.getElementById("apiStatus");
    const input = document.getElementById("mealQuery");

    if (!results || !status || !input) return;

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const query = input.value.trim();

        results.replaceChildren();

        if (!query) {
            status.textContent = "Enter a dish name.";
            input.focus();
            return;
        }

        const button = form.querySelector(
            'button[type="submit"]'
        );

        if (button) {
            button.disabled = true;
        }

        status.textContent = "Loading recipes...";

        try {
            const url =
                "https://www.themealdb.com/api/json/v1/1/search.php?s=" +
                encodeURIComponent(query);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Recipe API unavailable.");
            }

            const data = await response.json();

            const meals = Array.isArray(data.meals)
                ? data.meals.slice(0, 3)
                : [];

            if (meals.length === 0) {
                status.textContent =
                    "No matching recipes found.";
                return;
            }

            status.textContent =
                `Showing ${meals.length} recipes from TheMealDB.`;

            meals.forEach(meal => {
                const card = document.createElement("article");
                card.className = "card p-3 api-meal";

                const image = document.createElement("img");

                image.src =
                    meal.strMealThumb || createImageFallback();

                image.alt =
                    meal.strMeal || "Recipe image";

                image.loading = "lazy";
                image.decoding = "async";
                image.className = "recipe-image mb-3";

                image.addEventListener(
                    "error",
                    function () {
                        if (this.dataset.fallbackUsed) return;

                        this.dataset.fallbackUsed = "true";
                        this.src = createImageFallback();
                    }
                );

                const title = document.createElement("h3");
                title.className = "h5";
                title.textContent =
                    meal.strMeal || "Unnamed dish";

                const country = document.createElement("p");
                country.textContent =
                    `${meal.strArea || "International"} cuisine`;

                const description = document.createElement("p");

                const instructions =
                    meal.strInstructions ||
                    "No instructions available.";

                description.textContent =
                    instructions.length > 450
                        ? instructions.slice(0, 450) + "..."
                        : instructions;

                card.append(
                    image,
                    title,
                    country,
                    description
                );

                results.append(card);
            });

        } catch (error) {
            console.error("TheMealDB error:", error);

            status.textContent =
                "Could not load recipes. Check your connection and try again.";

        } finally {
            if (button) {
                button.disabled = false;
            }
        }
    });
}

// ==========================================
// 15. IMAGE LAZY LOADING
// ==========================================

function createImageFallback() {
    const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" ' +
        'width="600" height="400">' +
        '<rect width="100%" height="100%" fill="#e7e2da"/>' +
        '<text x="50%" y="50%" text-anchor="middle" ' +
        'font-family="Arial" font-size="24" fill="#555">' +
        'Image unavailable</text>' +
        '</svg>';

    return "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(svg);
}

function initLazyImages() {
    const fallback = createImageFallback();

    function loadImage(image) {
        if (!image.dataset.src) return;

        const realSrc = image.dataset.src;

        image.removeAttribute("data-src");
        image.src = realSrc;
    }

    let observer = null;

    if ("IntersectionObserver" in window) {
        observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;

                    loadImage(entry.target);
                    observer.unobserve(entry.target);
                });
            },
            {
                rootMargin: "250px 0px",
                threshold: 0.01
            }
        );
    }

    document.querySelectorAll("img").forEach(image => {

        // Replace broken images with a local SVG data URL
        function showFallback() {
            if (image.dataset.fallbackUsed) return;

            image.dataset.fallbackUsed = "true";
            image.src = fallback;
        }

        image.addEventListener("error", showFallback);

        // Support old HTML images with data-src
        if (image.dataset.src) {
            image.src = fallback;

            if (observer) {
                observer.observe(image);
            } else {
                loadImage(image);
            }

            return;
        }

        // Native browser lazy loading
        const isHero = image.classList.contains("hero-image");

        const isFirstCarousel =
            Boolean(image.closest(".carousel-item.active"));

        if (isHero || isFirstCarousel) {
            image.loading = "eager";
        } else if (!image.hasAttribute("loading")) {
            image.loading = "lazy";
        }

        image.decoding = "async";

        // Handle images that failed before JS initialized
        if (image.complete && image.naturalWidth === 0) {
            showFallback();
        }
    });
}

// ==========================================
// 16. SCROLL PROGRESS
// ==========================================

function initScroll() {
    function updateProgress() {
        const max =
            document.documentElement.scrollHeight -
            window.innerHeight;

        const progress = max > 0
            ? Math.round(
                (window.scrollY / max) * 100
            )
            : 100;

        $("#scrollProgress")
            .css("width", progress + "%")
            .attr("aria-valuenow", progress);
    }

    window.addEventListener(
        "scroll",
        updateProgress,
        { passive: true }
    );

    window.addEventListener(
        "resize",
        updateProgress
    );

    updateProgress();

    // Animated statistics
    function animateCounter(element) {
        if (element.dataset.started) return;

        element.dataset.started = "true";

        const target =
            Number(element.dataset.target) || 0;

        $({ value: 0 }).animate(
            { value: target },
            {
                duration: 1400,

                step(value) {
                    element.textContent = Math.floor(value);
                },

                complete() {
                    element.textContent = target;
                }
            }
        );
    }

    const counters =
        document.querySelectorAll(".counter");

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;

                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                });
            }
        );

        counters.forEach(counter => {
            observer.observe(counter);
        });

    } else {
        counters.forEach(animateCounter);
    }
}
