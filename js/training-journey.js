(function () {
  "use strict";

  const pathway = [
    {
      id: "python-foundations",
      title: "Python Foundations for Data Science",
      readinessId: "new-python",
      detailPath: "python-foundations-for-data-science/",
      explanation:
        "You are still building programming fluency, so this course gives you the foundation needed for later data work.",
      skipGuidance: "No earlier courses are required.",
    },
    {
      id: "data-analysis",
      title: "Applied Data Analysis with Python",
      readinessId: "basic-python",
      detailPath: "applied-data-analysis-with-python/",
      explanation:
        "You already know basic Python and are ready to apply it to real datasets.",
      skipGuidance:
        "Python Foundations is not required if you meet these prerequisites.",
    },
    {
      id: "machine-learning",
      title: "Practical Machine Learning Foundations",
      readinessId: "data-analysis",
      detailPath: "practical-machine-learning-foundations/",
      explanation:
        "You can analyse tabular data independently and are ready to learn how models are framed, trained, and evaluated.",
      skipGuidance:
        "Python Foundations and Applied Data Analysis are not required if you meet these prerequisites.",
    },
    {
      id: "generative-ai",
      title: "Generative AI Application Development",
      readinessId: "ml-fundamentals",
      detailPath: "generative-ai-application-development/",
      explanation:
        "You understand machine-learning fundamentals and are ready to build grounded, testable applications around language models.",
      skipGuidance:
        "The earlier pathway courses are not required if you meet these prerequisites.",
    },
    {
      id: "reliable-ai",
      title: "Engineering Reliable AI Systems",
      readinessId: "ai-applications",
      detailPath: "engineering-reliable-ai-systems/",
      explanation:
        "You already build AI applications and are ready to make them controlled, secure, observable, and maintainable.",
      skipGuidance:
        "The earlier pathway courses are not required if you meet these prerequisites.",
    },
  ];

  const courseByReadiness = Object.fromEntries(
    pathway.map((course) => [course.readinessId, course]),
  );

  function recommendCourse(readinessId) {
    return courseByReadiness[readinessId] || null;
  }

  function event(name, parameters) {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, parameters || {});
    }
  }

  function focusTargetFromHash(link) {
    const target = document.querySelector(link.hash);
    if (!target) return;
    window.requestAnimationFrame(() => target.focus({ preventScroll: true }));
  }

  const selector = document.querySelector("[data-readiness-selector]");
  const result = document.querySelector("[data-starting-result]");
  const courseNodes = Array.from(
    document.querySelectorAll("[data-course-node]"),
  );

  function showRecommendation(readinessId) {
    const course = recommendCourse(readinessId);
    if (!course || !result) return null;

    courseNodes.forEach((node) => {
      const recommended = node.dataset.courseNode === course.id;
      node.classList.toggle("is-recommended", recommended);
      const label = node.querySelector(".journey-recommendation");
      if (label) label.hidden = !recommended;
    });

    result.innerHTML =
      '<p class="learning-status-marker">Recommended starting point</p>' +
      "<h3>" +
      course.title +
      "</h3>" +
      "<p>" +
      course.explanation +
      " " +
      course.skipGuidance +
      "</p>" +
      '<a class="btn btn-primary btn-learning" data-recommended-course-link href="' +
      course.detailPath +
      '">View course</a>';
    result.focus();

    event("training_readiness_selected", {
      readiness_id: readinessId,
      recommended_course_id: course.id,
    });
    event("training_recommended_course_shown", {
      readiness_id: readinessId,
      course_id: course.id,
    });
    return course;
  }

  if (selector) {
    selector.addEventListener("change", (change) => {
      if (change.target.matches('input[name="readiness"]')) {
        showRecommendation(change.target.value);
      }
    });
  }

  const journey = document.getElementById("journey");
  if (journey && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          event("training_pathway_view");
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(journey);
  }

  document.addEventListener("click", (click) => {
    const sectionLink = click.target.closest('a[href^="#"]');
    if (sectionLink && sectionLink.hash) focusTargetFromHash(sectionLink);

    const recommendedLink = click.target.closest(
      "[data-recommended-course-link]",
    );
    if (recommendedLink) {
      const selected =
        selector && selector.querySelector('input[name="readiness"]:checked');
      const course = selected ? recommendCourse(selected.value) : null;
      event("training_recommended_course_viewed", {
        readiness_id: selected ? selected.value : undefined,
        course_id: course ? course.id : undefined,
      });
    }

    const courseAction = click.target.closest("[data-course-action]");
    if (courseAction) {
      const actionName = {
        details: "training_pathway_course_viewed",
        preview: "training_pathway_course_viewed",
        interest: "training_register_interest_click",
        notify: "training_notify_me_click",
        enrol: "training_enrolment_click",
      }[courseAction.dataset.courseAction];
      if (actionName) {
        event(actionName, {
          course_id: courseAction.dataset.courseId,
          course_position: courseAction.dataset.coursePosition,
          course_lifecycle_status: courseAction.dataset.courseLifecycle,
          cohort_availability: courseAction.dataset.cohortAvailability,
        });
      }
    }

    const tracked = click.target.closest("[data-training-event]");
    if (tracked) {
      event(tracked.dataset.trainingEvent, {
        cta_location: tracked.dataset.ctaLocation,
      });
    }
  });

  window.sjTrainingJourney = { pathway, recommendCourse, showRecommendation };
})();
