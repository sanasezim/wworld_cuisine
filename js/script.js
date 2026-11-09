
"use strict";

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

const USER_KEY = "wc_demo_user";
const SESSION_KEY = "wc_demo_session";

function notifyUser(message) {
    $("#notification")
        .stop(true, true)
        .text(message)
        .fadeIn(150)
        .delay(2500)
        .fadeOut(300);
}

function readStorage(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || "null");
    } catch {
        return null;
    }
}

// 1. NIGHT MODE
function initTheme() {
    const savedTheme = localStorage.getItem("theme");

    $("body").toggleClass("night", savedTheme === "night");

    function updateButton() {
        const isNight = $("body").hasClass("night");

        $("#themeBtn")
            .text(isNight ? "Day mode" : "Night mode")
            .attr("aria-pressed", String(isNight));
    }

    updateButton();

    $("#themeBtn").on("click", function () {
        $("body").toggleClass("night");
        document.body.style.backgroundColor = "";

        const theme = $("body").hasClass("night")
            ? "night"
            : "day";

        localStorage.setItem("theme", theme);
        updateButton();
    });
}

// 2. NAVIGATION (NO LOGIN BUTTON)
function initNavigation() {
    $(".navbar-nav a[href='login.html']")
        .closest("li")
        .remove();

    const links = $(".navbar-nav .nav-link").get();

    links.forEach((link, index) => {
        link.addEventListener("keydown", function (event) {
            let next;

            if (event.key === "ArrowRight" ||
                event.key === "ArrowDown") {
                next = (index + 1) % links.length;
            } else if (
                event.key === "ArrowLeft" ||
                event.key === "ArrowUp"
            ) {
                next = (index - 1 + links.length) % links.length;
            } else if (event.key === "Home") {
                next = 0;
            } else if (event.key === "End") {
                next = links.length - 1;
            } else {
                return;
            }

            event.preventDefault();
            links[next].focus();
        });
    });
}

// 3. HOME PAGE
function initHome() {
    // Current date and time
    function updateTime() {
        const element = document.getElementById("datetime");
        if (!element) return;

        element.textContent = new Date().toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });
    }

    updateTime();

    if ($("#datetime").length) {
        setInterval(updateTime, 1000);
    }

    // Background colors
    let colorIndex = 0;

    $("#colorBtn").on("click", function () {
        const colors = $("body").hasClass("night")
            ? ["#15161a", "#292129", "#172a24"]
            : ["#fde8e0", "#e3f2e1", "#e0ecfb"];

        $("body").css(
            "background-color",
            colors[colorIndex++ % colors.length]
        );
    });

    // FAQ
    $(".faq-question").on("click", function () {
        const open = $(this).attr("aria-expanded") !== "true";

        $(this).attr("aria-expanded", String(open));

        $(this).next(".faq-answer")
            .stop(true, true)
            .slideToggle(200);
    });

    // Subscribe popup
    function closePopup() {
        $("#popupOverlay").removeClass("show");
        $("body").css("overflow", "");
        $("#openPopup").trigger("focus");
    }

    $("#openPopup").on("click", function () {
        $("#popupOverlay").addClass("show");
        $("body").css("overflow", "hidden");
        $("#subEmail").trigger("focus");
    });

    $("#closePopup").on("click", closePopup);

    $("#popupOverlay").on("click", function (event) {
        if (event.target === this) closePopup();
    });

    $(document).on("keydown", function (event) {
        if (!$("#popupOverlay").hasClass("show")) return;

        if (event.key === "Escape") {
            closePopup();
            return;
        }

        if (event.key !== "Tab") return;

        const items = $("#popupOverlay")
            .find("button:enabled, input:enabled")
            .get();

        if (!items.length) return;

        if (event.shiftKey &&
            document.activeElement === items[0]) {
            event.preventDefault();
            items[items.length - 1].focus();
        } else if (
            !event.shiftKey &&
            document.activeElement === items[items.length - 1]
        ) {
            event.preventDefault();
            items[0].focus();
        }
    });
}

// 4. READ MORE
function initReadMore() {
    $(".read-more-btn").on("click", function () {
        const detail = $(this).next(".more-text");
        const open = !detail.is(":visible");

        detail.stop(true, true).slideToggle(200);

        $(this)
            .text(open ? "Read less" : "Read more")
            .attr("aria-expanded", String(open));
    });
}

// 5. DISH RATINGS
function initRatings() {
    $(".gallery-item").each(function () {
        const card = $(this);
        const name = card.find("figcaption strong").text().trim();
        const key = "rating_" + name;

        const rating = $('<div class="rating"></div>');
        const label = $('<span class="rating-value"></span>');

        let saved = Number(localStorage.getItem(key)) || 0;

        function updateStars(value) {
            rating.find(".star").each(function () {
                const number = Number(this.dataset.value);

                $(this)
                    .toggleClass("active", number <= value)
                    .attr("aria-pressed", String(number === value));
            });

            label.text(value ? value + "/5" : "Rate it");
        }

        for (let i = 1; i <= 5; i++) {
            $("<button>", {
                type: "button",
                class: "star",
                text: "★"
            })
                .attr("data-value", i)
                .attr("aria-label", `Rate ${name} ${i} out of 5`)
                .on("click", function () {
                    localStorage.setItem(key, String(i));

                    updateStars(i);

                    card.removeClass("pop");
                    void card[0].offsetWidth;
                    card.addClass("pop");

                    notifyUser(`You rated ${name} ${i}/5`);
                })
                .appendTo(rating);
        }

        rating.append(label);
        card.append(rating);

        updateStars(saved);
    });
}

// 6. LIVE SEARCH AND AUTOCOMPLETE
function initSearch() {
    const input = $("#dishSearch");
    if (!input.length) return;

    const cards = $(".gallery-item");
    const suggestions = $("#searchSuggestions");

    const names = cards.map(function () {
        return $(this).find("figcaption strong").text().trim();
    }).get();

    function closeSuggestions() {
        suggestions.prop("hidden", true);
        input.attr("aria-expanded", "false");
    }

    function highlight(element, query) {
        if (!element.dataset.original) {
            element.dataset.original = element.textContent;
        }

        const text = element.dataset.original;
        element.replaceChildren();

        const index = text.toLowerCase().indexOf(query);

        if (!query || index === -1) {
            element.textContent = text;
            return;
        }

        const mark = document.createElement("mark");
        mark.textContent = text.slice(index, index + query.length);

        element.append(
            document.createTextNode(text.slice(0, index)),
            mark,
            document.createTextNode(text.slice(index + query.length))
        );
    }

    function search(showSuggestions = true) {
        const query = input.val().trim().toLowerCase();
        let count = 0;

        cards.each(function () {
            const card = $(this);

            const name = card.find("figcaption strong").text();
            const country = card.find("figcaption span").text();

            const match = (name + " " + country)
                .toLowerCase()
                .includes(query);

            card.toggle(match);
            if (match) count++;

            card.find("figcaption strong, figcaption span")
                .each(function () {
                    highlight(this, query);
                });
        });

        $("#searchCount").text(
            count
                ? `Showing ${count} of ${cards.length} dishes`
                : "No matching dishes found."
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

        const open = suggestions.children().length > 0;

        suggestions.prop("hidden", !open);
        input.attr("aria-expanded", String(open));
    }

    input.on("input", () => search(true));

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

        if (!["ArrowDown", "ArrowUp"].includes(event.key)) {
            return;
        }

        if (suggestions.prop("hidden")) return;

        const buttons = suggestions.find("button").get();
        if (!buttons.length) return;

        event.preventDefault();

        const index = buttons.indexOf(document.activeElement);

        const next = event.key === "ArrowDown"
            ? index + 1
            : index - 1;

        buttons[(next + buttons.length) % buttons.length].focus();
    });

    $(document).on("click", function (event) {
        if (!$(event.target).closest(".search-panel").length) {
            closeSuggestions();
        }
    });

    search(false);
}

// 7. RECIPE FILTERS AND COPY BUTTON
function initRecipes() {
    function filterRecipes(category) {
        $(".filter-btn")
            .removeClass("active")
            .filter(`[data-filter="${category}"]`)
            .addClass("active");

        let count = 0;

        $(".recipe-box").each(function () {
            const match = category === "all" ||
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
            }).get();

        const steps = card.find("ol li")
            .map(function (index) {
                return `${index + 1}. ${this.textContent.trim()}`;
            }).get();

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

// 8. RESTAURANT RATINGS
function initRestaurants() {
    const ratings = [4.7, 4.5, 4.3, 4.6, 4.4, 4.2];

    $(".restaurant-card").each(function (index) {
        if (ratings[index] === undefined) return;

        if ($(this).find(".restaurant-rating").length) return;

        $("<p>", {
            class: "restaurant-rating",
            text: `Sample rating: ${ratings[index]}/5`
        }).appendTo($(this).find(".card-body"));
    });
}

// 9. FORM VALIDATION
function showError(input, message) {
    const field = $(input);

    const anchor = field.closest(".input-group").length
        ? field.closest(".input-group")
        : field;

    let error = anchor.next(".field-error");

    if (!error.length) {
        error = $('<div class="field-error" role="alert"></div>');
        error.insertAfter(anchor);
    }

    error.text(message);

    field
        .toggleClass("is-invalid", Boolean(message))
        .attr("aria-invalid", String(Boolean(message)));
}

function validateFields(form, ids) {
    let valid = true;
    let firstInvalid = null;

    ids.forEach(id => {
        const input = form.querySelector("#" + id);
        if (!input) return;

        const value = input.type === "checkbox"
            ? input.checked
            : input.value.trim();

        let error = "";

        if (!value) {
            error = "This field is required.";
        } else if (
            ["email", "subEmail", "regEmail", "loginEmail"].includes(id) &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ) {
            error = "Enter a valid email address.";
        } else if (
            ["phone", "regPhone"].includes(id) &&
            !/^\+?[0-9]{10,15}$/.test(
                value.replace(/[\s()-]/g, "")
            )
        ) {
            error = "Enter a valid phone number.";
        } else if (
            id === "regPassword" &&
            !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(value)
        ) {
            error = "Use 8+ characters, uppercase, lowercase, number and symbol.";
        } else if (
            id === "regConfirm" &&
            value !== $("#regPassword").val()
        ) {
            error = "Passwords do not match.";
        } else if (
            id === "message" &&
            value.length < 10
        ) {
            error = "Enter at least 10 characters.";
        }

        showError(input, error);

        if (error) {
            valid = false;
            if (!firstInvalid) firstInvalid = input;
        }
    });

    if (firstInvalid) firstInvalid.focus();

    return valid;
}

function simulateSubmit(form, message) {
    const button = $(form).find('[type="submit"]');
    const original = button.html();

    button
        .prop("disabled", true)
        .html(
            '<span class="loading-spinner" aria-hidden="true"></span>' +
            " Please wait..."
        );

    setTimeout(function () {
        form.reset();

        button.prop("disabled", false).html(original);

        $(form).find(".field-error").text("");
        $(form).find(".is-invalid")
            .removeClass("is-invalid");

        $(form).find(".form-success").text(message);
        notifyUser(message);
    }, 1000);
}

function initForms() {
    $("form").attr("novalidate", "novalidate");

    $("form").on(
        "input change",
        "input, select, textarea",
        function () {
            showError(this, "");
            $(this.form).find(".form-success").text("");
        }
    );

    const contact = document.getElementById("contactForm");

    if (contact) {
        let step = 1;

        function showStep(number) {
            step = number;

            $(contact).find(".form-step")
                .removeClass("active")
                .filter(`[data-step="${number}"]`)
                .addClass("active");

            $("#stepIndicator").text(`Step ${number} of 2`);
        }

        $("#nextBtn").on("click", function () {
            if (validateFields(contact, [
                "name", "email", "phone"
            ])) {
                showStep(2);
            }
        });

        $("#backBtn").on("click", () => showStep(1));

        $(contact).on("submit", function (event) {
            event.preventDefault();

            if (step === 1) {
                $("#nextBtn").trigger("click");
                return;
            }

            if (!validateFields(contact, [
                "name", "email", "phone"
            ])) {
                showStep(1);
                return;
            }

            if (validateFields(contact, [
                "cuisine", "message", "confirm"
            ])) {
                simulateSubmit(
                    contact,
                    "Recommendation submitted successfully!"
                );

                setTimeout(() => showStep(1), 1010);
            }
        });

        $(contact).on("reset", () => {
            setTimeout(() => showStep(1), 0);
        });

        $(contact).on("keydown", "input", function (event) {
            if (event.key === "Enter" && step === 1) {
                event.preventDefault();
                $("#nextBtn").trigger("click");
            }
        });
    }

    $("#subscribeForm").on("submit", function (event) {
        event.preventDefault();

        if (validateFields(this, ["subEmail"])) {
            simulateSubmit(this, "Subscribed successfully!");
        }
    });

    $("#registerForm").on("submit", function (event) {
        event.preventDefault();

        if (!validateFields(this, [
            "regName",
            "regEmail",
            "regPhone",
            "regPassword",
            "regConfirm"
        ])) return;

        const user = {
            name: $("#regName").val().trim(),
            email: $("#regEmail").val().trim().toLowerCase(),
            phone: $("#regPhone").val()?.trim() || "",
            password: $("#regPassword").val()
        };

        // Classroom demo only; never use a real password.
        try {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            $(this).find(".form-success")
                .text("Demo account created successfully.");
            notifyUser("Account created!");
        } catch {
            $(this).find(".form-success")
                .text("Browser storage is unavailable.");
        }
    });

    $("#loginForm").on("submit", function (event) {
        event.preventDefault();

        if (!validateFields(this, [
            "loginEmail", "loginPassword"
        ])) return;

        const user = readStorage(USER_KEY);

        const email = $("#loginEmail")
            .val().trim().toLowerCase();

        const password = $("#loginPassword").val();

        if (!user ||
            user.email !== email ||
            user.password !== password) {
            $(this).find(".form-success")
                .text("Incorrect email or password.");
            return;
        }

        localStorage.setItem(SESSION_KEY, user.email);
        window.location.href = "profile.html";
    });
}

// 10. PROFILE
function initProfile() {
    if (!$("#profileName").length) return;

    const user = readStorage(USER_KEY);
    const session = localStorage.getItem(SESSION_KEY);

    if (!user || session !== user.email) {
        window.location.replace("login.html");
        return;
    }

    $("#profileName").text(user.name);
    $("#profileEmail").text(user.email);
    $("#profilePhone").text(user.phone || "Not provided");

    $("#logoutBtn").on("click", function () {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = "index.html";
    });
}

// 11. EXTERNAL RECIPE API
function initMealAPI() {
    const form = document.getElementById("mealSearchForm");
    if (!form) return;

    const results = document.getElementById("apiResults");
    const status = document.getElementById("apiStatus");

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const query = document
            .getElementById("mealQuery").value.trim();

        results.replaceChildren();

        if (!query) {
            status.textContent = "Enter a dish name.";
            return;
        }

        const button = form.querySelector('button[type="submit"]');
        button.disabled = true;

        status.textContent = "Loading recipes...";

        try {
            const url =
                "https://www.themealdb.com/api/json/v1/1/search.php?s=" +
                encodeURIComponent(query);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("API error");
            }

            const data = await response.json();
            const meals = (data.meals || []).slice(0, 3);

            if (!meals.length) {
                status.textContent = "No matching recipes found.";
                return;
            }

            status.textContent =
                `Showing ${meals.length} recipes.`;

            meals.forEach(meal => {
                const card = document.createElement("article");
                card.className = "card p-3 api-meal";

                const image = document.createElement("img");
                image.src = meal.strMealThumb;
                image.alt = meal.strMeal;
                image.loading = "lazy";
                image.decoding = "async";
                image.className = "recipe-image mb-3";

                const title = document.createElement("h3");
                title.className = "h5";
                title.textContent = meal.strMeal;

                const country = document.createElement("p");
                country.textContent =
                    `${meal.strArea || "International"} cuisine`;

                const description = document.createElement("p");
                description.textContent =
                    (meal.strInstructions || "").slice(0, 450) + "...";

                card.append(image, title, country, description);
                results.append(card);
            });
        } catch {
            status.textContent =
                "Could not load recipes. Try again.";
        } finally {
            button.disabled = false;
        }
    });
}

// 12. IMAGE LAZY LOADING
function initLazyImages() {
    const fallback =
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" ' +
            'width="600" height="400">' +
            '<rect width="100%" height="100%" fill="#e7e2da"/>' +
            '<text x="50%" y="50%" text-anchor="middle" ' +
            'font-size="24" fill="#555" font-family="Arial">' +
            'Image unavailable</text></svg>'
        );

    function loadImage(image) {
        if (!image.dataset.src) return;

        image.src = image.dataset.src;
        image.removeAttribute("data-src");
    }

    const images = document.querySelectorAll("img");

    let observer = null;

    if ("IntersectionObserver" in window) {
        observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                loadImage(entry.target);
                observer.unobserve(entry.target);
            });
        }, {
            rootMargin: "250px 0px"
        });
    }

    images.forEach(image => {
        image.addEventListener("error", function () {
            if (this.dataset.fallbackUsed) return;

            this.dataset.fallbackUsed = "true";
            this.src = fallback;
        });

        if (image.dataset.src) {
            image.src = fallback;

            if (observer) {
                observer.observe(image);
            } else {
                loadImage(image);
            }
        }
    });
}

// 13. SCROLL PROGRESS AND COUNTERS
function initScroll() {
    function updateProgress() {
        const max =
            document.documentElement.scrollHeight -
            window.innerHeight;

        const progress = max > 0
            ? Math.round(window.scrollY / max * 100)
            : 100;

        $("#scrollProgress")
            .css("width", progress + "%")
            .attr("aria-valuenow", progress);
    }

    window.addEventListener("scroll", updateProgress, {
        passive: true
    });

    window.addEventListener("resize", updateProgress);

    updateProgress();

    function animateCounter(element) {
        if (element.dataset.started) return;

        element.dataset.started = "true";

        const target = Number(element.dataset.target) || 0;

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

    const counters = document.querySelectorAll(".counter");

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                animateCounter(entry.target);
                observer.unobserve(entry.target);
            });
        });

        counters.forEach(counter => observer.observe(counter));
    } else {
        counters.forEach(animateCounter);
    }
}
