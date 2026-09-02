import type { RuleDefinition } from "@frontend-experience-analyzer/core";
import { accessibleNameRule } from "./rules/accessible-name.js";
import { clippedTextRule } from "./rules/clipped-text.js";
import { clsThresholdRule } from "./rules/cls-threshold.js";
import { consoleErrorRule } from "./rules/console-error-on-interaction.js";
import { dropdownKeyboardOperableRule } from "./rules/dropdown-keyboard-operable.js";
import { duplicateIdRule } from "./rules/duplicate-id.js";
import { emptyLinkRule } from "./rules/empty-link.js";
import { fieldErrorAssociationRule } from "./rules/field-error-association.js";
import { fixedWidthLayoutRule } from "./rules/fixed-width-layout.js";
import { focusIndicatorRule } from "./rules/focus-indicator.js";
import { focusLostAfterInteractionRule } from "./rules/focus-lost-after-interaction.js";
import { formLabelRule } from "./rules/form-label.js";
import { formMissingValidationFeedbackRule } from "./rules/form-missing-validation-feedback.js";
import { headingHierarchyRule } from "./rules/heading-hierarchy.js";
import { htmlLangRule } from "./rules/html-lang.js";
import { iconOnlyButtonNameRule } from "./rules/icon-only-button-name.js";
import { imageAltRule } from "./rules/image-alt.js";
import { inlineEventHandlerXssRule } from "./rules/inline-event-handler-xss.js";
import { insecureFormActionRule } from "./rules/insecure-form-action.js";
import { insecureHrefJavascriptRule } from "./rules/insecure-href-javascript.js";
import { lcpThresholdRule } from "./rules/lcp-threshold.js";
import { missingCspRule } from "./rules/missing-csp.js";
import { mixedContentRule } from "./rules/mixed-content.js";
import { modalDialogSemanticsRule } from "./rules/modal-dialog-semantics.js";
import { modalEscapeCloseRule } from "./rules/modal-escape-close.js";
import { modalLargerThanViewportRule } from "./rules/modal-larger-than-viewport.js";
import { networkErrorRule } from "./rules/network-error-on-interaction.js";
import { nonButtonKeyboardRule } from "./rules/non-button-keyboard.js";
import { oversizedJavascriptBundleRule } from "./rules/oversized-javascript-bundle.js";
import { pageTitleRule } from "./rules/page-title.js";
import { renderBlockingResourcesRule } from "./rules/render-blocking-resources.js";
import { sensitiveInputAutocompleteRule } from "./rules/sensitive-input-autocomplete.js";
import { stickyHeaderOverlapRule } from "./rules/sticky-header-overlap.js";
import { subresourceIntegrityRule } from "./rules/subresource-integrity.js";
import { tableResponsiveRule } from "./rules/table-responsive.js";
import { targetSizeRule } from "./rules/target-size.js";
import { touchTargetSpacingRule } from "./rules/touch-target-spacing.js";
import { unoptimizedImagesRule } from "./rules/unoptimized-images.js";
import { unprotectedSensitiveInputRule } from "./rules/unprotected-sensitive-input.js";
import { unresponsiveButtonRule } from "./rules/unresponsive-button.js";
import { viewportOverflowRule } from "./rules/viewport-overflow.js";
import { vulnerableLinkTargetRule } from "./rules/vulnerable-link-target.js";

export * from "./rules/accessible-name.js";
export * from "./rules/clipped-text.js";
export * from "./rules/cls-threshold.js";
export * from "./rules/console-error-on-interaction.js";
export * from "./rules/dropdown-keyboard-operable.js";
export * from "./rules/duplicate-id.js";
export * from "./rules/empty-link.js";
export * from "./rules/field-error-association.js";
export * from "./rules/fixed-width-layout.js";
export * from "./rules/focus-indicator.js";
export * from "./rules/focus-lost-after-interaction.js";
export * from "./rules/form-label.js";
export * from "./rules/form-missing-validation-feedback.js";
export * from "./rules/heading-hierarchy.js";
export * from "./rules/html-lang.js";
export * from "./rules/icon-only-button-name.js";
export * from "./rules/image-alt.js";
export * from "./rules/inline-event-handler-xss.js";
export * from "./rules/insecure-form-action.js";
export * from "./rules/insecure-href-javascript.js";
export * from "./rules/lcp-threshold.js";
export * from "./rules/missing-csp.js";
export * from "./rules/mixed-content.js";
export * from "./rules/modal-dialog-semantics.js";
export * from "./rules/modal-escape-close.js";
export * from "./rules/modal-larger-than-viewport.js";
export * from "./rules/network-error-on-interaction.js";
export * from "./rules/non-button-keyboard.js";
export * from "./rules/oversized-javascript-bundle.js";
export * from "./rules/page-load-failure.js";
export * from "./rules/page-title.js";
export * from "./rules/render-blocking-resources.js";
export * from "./rules/sensitive-input-autocomplete.js";
export * from "./rules/sticky-header-overlap.js";
export * from "./rules/subresource-integrity.js";
export * from "./rules/table-responsive.js";
export * from "./rules/target-size.js";
export * from "./rules/touch-target-spacing.js";
export * from "./rules/unoptimized-images.js";
export * from "./rules/unprotected-sensitive-input.js";
export * from "./rules/unresponsive-button.js";
export * from "./rules/viewport-overflow.js";
export * from "./rules/vulnerable-link-target.js";
export * from "./utils.js";

export const BUILTIN_RULES: RuleDefinition[] = [
  pageTitleRule,
  htmlLangRule,
  headingHierarchyRule,
  duplicateIdRule,
  imageAltRule,
  formLabelRule,
  accessibleNameRule,
  emptyLinkRule,
  iconOnlyButtonNameRule,
  nonButtonKeyboardRule,
  modalDialogSemanticsRule,
  fieldErrorAssociationRule,
  focusIndicatorRule,
  targetSizeRule,
  touchTargetSpacingRule,
  viewportOverflowRule,
  clippedTextRule,
  fixedWidthLayoutRule,
  modalLargerThanViewportRule,
  tableResponsiveRule,
  stickyHeaderOverlapRule,
  consoleErrorRule,
  networkErrorRule,
  modalEscapeCloseRule,
  unresponsiveButtonRule,
  focusLostAfterInteractionRule,
  formMissingValidationFeedbackRule,
  dropdownKeyboardOperableRule,
  lcpThresholdRule,
  clsThresholdRule,
  oversizedJavascriptBundleRule,
  unoptimizedImagesRule,
  renderBlockingResourcesRule,
  missingCspRule,
  vulnerableLinkTargetRule,
  mixedContentRule,
  sensitiveInputAutocompleteRule,
  subresourceIntegrityRule,
  insecureFormActionRule,
  inlineEventHandlerXssRule,
  insecureHrefJavascriptRule,
  unprotectedSensitiveInputRule,
];
