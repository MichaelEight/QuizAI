import { useEffect } from 'react';

/**
 * Custom hook to convert native title tooltips to faster custom tooltips
 * Converts title="" to data-tooltip="" to use custom CSS tooltips with 500ms delay
 */
export function useFastTooltips() {
  useEffect(() => {
    const convertTooltips = () => {
      // Find all elements with title attribute
      const elementsWithTitle = document.querySelectorAll('[title]');

      elementsWithTitle.forEach((element) => {
        const titleText = element.getAttribute('title');
        if (titleText) {
          // Set custom tooltip attribute
          element.setAttribute('data-tooltip', titleText);
          // Remove native title to prevent browser tooltip
          element.removeAttribute('title');
        }
      });
    };

    // Convert existing tooltips
    convertTooltips();

    // Set up MutationObserver to handle dynamically added elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Check if nodes were added
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach((node) => {
            // Only process element nodes
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;

              // Check the element itself
              if (element.hasAttribute('title')) {
                const titleText = element.getAttribute('title');
                if (titleText) {
                  element.setAttribute('data-tooltip', titleText);
                  element.removeAttribute('title');
                }
              }

              // Check children of the element
              const childrenWithTitle = element.querySelectorAll('[title]');
              childrenWithTitle.forEach((child) => {
                const titleText = child.getAttribute('title');
                if (titleText) {
                  child.setAttribute('data-tooltip', titleText);
                  child.removeAttribute('title');
                }
              });
            }
          });
        }

        // Check if attributes were modified
        if (mutation.type === 'attributes' && mutation.attributeName === 'title') {
          const element = mutation.target as Element;
          const titleText = element.getAttribute('title');
          if (titleText) {
            element.setAttribute('data-tooltip', titleText);
            element.removeAttribute('title');
          }
        }
      });
    });

    // Start observing the document with the configured parameters
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['title']
    });

    // Cleanup function
    return () => {
      observer.disconnect();
    };
  }, []);
}
