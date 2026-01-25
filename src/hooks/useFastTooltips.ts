import { useEffect } from 'react';

/**
 * Custom hook to convert native title tooltips to faster custom tooltips
 * Converts title="" to data-tooltip="" and creates positioned tooltip elements
 * with smart edge detection to prevent cutoff
 */
export function useFastTooltips() {
  useEffect(() => {
    let tooltipElement: HTMLDivElement | null = null;
    let arrowElement: HTMLDivElement | null = null;
    let showTimeout: NodeJS.Timeout | null = null;
    let currentTarget: Element | null = null;

    const createTooltipElements = () => {
      // Create tooltip container
      tooltipElement = document.createElement('div');
      tooltipElement.className = 'custom-tooltip';
      tooltipElement.style.cssText = `
        position: fixed;
        padding: 6px 10px;
        background-color: #1e293b;
        color: #f1f5f9;
        font-size: 0.875rem;
        line-height: 1.25rem;
        border-radius: 6px;
        border: 1px solid #475569;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
        pointer-events: none;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.15s ease-out;
        max-width: min(400px, calc(100vw - 32px));
        white-space: normal;
        word-wrap: break-word;
      `;

      // Create arrow
      arrowElement = document.createElement('div');
      arrowElement.className = 'custom-tooltip-arrow';
      arrowElement.style.cssText = `
        position: fixed;
        width: 0;
        height: 0;
        border: 5px solid transparent;
        pointer-events: none;
        z-index: 10001;
        opacity: 0;
        transition: opacity 0.15s ease-out;
      `;

      document.body.appendChild(tooltipElement);
      document.body.appendChild(arrowElement);
    };

    const positionTooltip = (target: Element, text: string) => {
      if (!tooltipElement || !arrowElement) return;

      tooltipElement.textContent = text;

      const rect = target.getBoundingClientRect();
      const tooltipRect = tooltipElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Default positioning: centered above the element
      let top = rect.top - tooltipRect.height - 8;
      let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
      let placement: 'top' | 'bottom' = 'top';

      // Check if tooltip goes off the top
      if (top < 8) {
        // Position below instead
        top = rect.bottom + 8;
        placement = 'bottom';
      }

      // Check if tooltip goes off the left
      if (left < 8) {
        left = 8;
      }

      // Check if tooltip goes off the right
      if (left + tooltipRect.width > viewportWidth - 8) {
        left = viewportWidth - tooltipRect.width - 8;
      }

      // Check if tooltip goes off the bottom (when placed below)
      if (placement === 'bottom' && top + tooltipRect.height > viewportHeight - 8) {
        // Try to place above again, even if it goes off top
        top = rect.top - tooltipRect.height - 8;
        placement = 'top';
      }

      // Position tooltip
      tooltipElement.style.top = `${top}px`;
      tooltipElement.style.left = `${left}px`;

      // Position arrow
      const arrowLeft = rect.left + rect.width / 2 - 5; // Arrow is 10px wide
      if (placement === 'top') {
        arrowElement.style.top = `${rect.top - 8}px`;
        arrowElement.style.left = `${arrowLeft}px`;
        arrowElement.style.borderTopColor = '#1e293b';
        arrowElement.style.borderBottomColor = 'transparent';
      } else {
        arrowElement.style.top = `${rect.bottom + 2}px`;
        arrowElement.style.left = `${arrowLeft}px`;
        arrowElement.style.borderBottomColor = '#1e293b';
        arrowElement.style.borderTopColor = 'transparent';
      }
    };

    const showTooltip = (target: Element) => {
      const text = target.getAttribute('data-tooltip');
      if (!text || !tooltipElement || !arrowElement) return;

      currentTarget = target;

      // Clear any existing timeout
      if (showTimeout) {
        clearTimeout(showTimeout);
      }

      // Position immediately but show after delay
      positionTooltip(target, text);

      showTimeout = setTimeout(() => {
        if (tooltipElement && arrowElement && currentTarget === target) {
          tooltipElement.style.opacity = '1';
          arrowElement.style.opacity = '1';
        }
      }, 500);
    };

    const hideTooltip = () => {
      if (showTimeout) {
        clearTimeout(showTimeout);
        showTimeout = null;
      }

      if (tooltipElement && arrowElement) {
        tooltipElement.style.opacity = '0';
        arrowElement.style.opacity = '0';
      }

      currentTarget = null;
    };

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

    // Create tooltip elements
    createTooltipElements();

    // Convert existing tooltips
    convertTooltips();

    // Add event listeners for tooltip triggers
    const handleMouseEnter = (e: Event) => {
      const target = e.target as Element;
      if (target.hasAttribute('data-tooltip')) {
        showTooltip(target);
      }
    };

    const handleMouseLeave = (e: Event) => {
      const target = e.target as Element;
      if (target.hasAttribute('data-tooltip')) {
        hideTooltip();
      }
    };

    document.body.addEventListener('mouseenter', handleMouseEnter, true);
    document.body.addEventListener('mouseleave', handleMouseLeave, true);

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
      document.body.removeEventListener('mouseenter', handleMouseEnter, true);
      document.body.removeEventListener('mouseleave', handleMouseLeave, true);

      if (showTimeout) {
        clearTimeout(showTimeout);
      }

      if (tooltipElement) {
        document.body.removeChild(tooltipElement);
      }

      if (arrowElement) {
        document.body.removeChild(arrowElement);
      }
    };
  }, []);
}
