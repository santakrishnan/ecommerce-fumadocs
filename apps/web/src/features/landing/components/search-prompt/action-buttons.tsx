import {
  SearchPreferencesPopover,
  type SearchPreferencesPopoverProps,
} from "@features/landing/components/search-prompt";
import { InputGroupButton } from "@ucmp/ui";
import { IconMic, IconPhotos, IconSend } from "@ucmp/ui/icons";
import { cn } from "@ucmp/ui/lib/utils";

/** Props for the ActionButtons component. */
interface ActionButtonsProps {
  /** Whether the search bar is in expanded (multiline/images) mode. */
  isExpanded: boolean;
  /** Called when the image attach button is clicked. Omit to hide the button. */
  onImageAttach?: () => void;
  /** Called when the mic button is clicked. */
  onMicClick: () => void;
  /** Called when the send button is clicked. */
  onSend: () => void;
  /** Props for the search preferences popover, which is conditionally rendered. */
  searchPreferences?: SearchPreferencesPopoverProps;
  /** Whether the send button should be visible. */
  showSend: boolean;
}

/**
 * Action button group for the search prompt.
 * Renders image attach, voice, preferences, and send buttons.
 * The image attach button only renders when `onImageAttach` is provided.
 */
export function ActionButtons({
  isExpanded,
  onImageAttach,
  onMicClick,
  onSend,
  showSend,
  searchPreferences,
}: ActionButtonsProps) {
  const preferencesModalKey = searchPreferences
    ? searchPreferences.explanationText
    : "no-preferences";
  return (
    <div
      className={cn("flex w-full items-center gap-2", isExpanded ? "justify-between" : "shrink-0")}
    >
      <div className="flex items-center gap-2">
        {onImageAttach && (
          <InputGroupButton aria-label="Attach image" onClick={onImageAttach} size="icon-xs">
            <IconPhotos className="size-5" />
          </InputGroupButton>
        )}
        <InputGroupButton aria-label="Voice search" onClick={onMicClick} size="icon-sm">
          <IconMic className="size-5" />
        </InputGroupButton>
        {searchPreferences && (
          <SearchPreferencesPopover key={preferencesModalKey} {...searchPreferences} />
        )}
      </div>
      {showSend && (
        <InputGroupButton
          aria-label="Search"
          className="transition-opacity duration-150"
          onClick={onSend}
          size="icon-sm"
        >
          <IconSend className="size-5" />
        </InputGroupButton>
      )}
    </div>
  );
}
