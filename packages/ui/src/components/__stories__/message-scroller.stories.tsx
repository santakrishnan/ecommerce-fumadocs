import type { Meta, StoryObj } from "@storybook/react"

import {
  MessageScroller,
  MessageScrollerProvider,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerViewport,
} from "@/components/message-scroller"

const messages = Array.from({ length: 28 }, (_, index) => {
  const id = index + 1
  const fromAgent = id % 3 !== 0

  return {
    id,
    fromAgent,
    text: fromAgent
      ? `Agent update #${id}: your search results were refreshed with the latest inventory.`
      : `User response #${id}: thanks, please sort by newest arrivals and include AWD only.`,
    time: `${8 + Math.floor(id / 6)}:${String((id * 7) % 60).padStart(2, "0")}`,
  }
})

const meta = {
  title: "Components/MessageScroller",
  component: MessageScroller,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Scrollable message feed built on [shadcn Message Scroller](https://ui.shadcn.com/docs/components/base/message-scroller). " +
          "Supports scroll anchors and contextual jump buttons to quickly move to the start or end.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof MessageScroller>

export default meta

type Story = StoryObj<typeof meta>

function MessageList({
  anchorIndex,
}: {
  anchorIndex: number
}) {
  return (
    <MessageScrollerContent className="gap-4 p-4">
      {messages.map((message, index) => (
        <MessageScrollerItem key={message.id} scrollAnchor={index === anchorIndex}>
          <article
            className={[
              "max-w-[85%] rounded-lg border p-3",
              message.fromAgent
                ? "border-border bg-muted text-foreground"
                : "ms-auto border-primary/20 bg-primary/10 text-foreground",
            ].join(" ")}
          >
            <header className="mb-1 flex items-center justify-between gap-4 text-xs text-muted-foreground">
              <span>{message.fromAgent ? "Agent" : "You"}</span>
              <time>{message.time}</time>
            </header>
            <p className="text-sm leading-relaxed">{message.text}</p>
          </article>
        </MessageScrollerItem>
      ))}
    </MessageScrollerContent>
  )
}

function DemoScroller({
  anchorIndex,
  showStartButton,
  showEndButton,
  defaultScrollPosition = "end",
}: {
  anchorIndex: number
  showStartButton?: boolean
  showEndButton?: boolean
  defaultScrollPosition?: "start" | "end" | "last-anchor"
}) {
  return (
    <div className="h-96 overflow-hidden">
      <MessageScrollerProvider defaultScrollPosition={defaultScrollPosition}>
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageList anchorIndex={anchorIndex} />
          </MessageScrollerViewport>
          {showStartButton ? <MessageScrollerButton direction="start" /> : null}
          {showEndButton ? <MessageScrollerButton direction="end" /> : null}
        </MessageScroller>
      </MessageScrollerProvider>
    </div>
  )
}

export const Default: Story = {
  render: () => <DemoScroller anchorIndex={messages.length - 1} showEndButton />,
  parameters: {
    docs: {
      description: {
        story:
          "Default chat-style feed anchored to the latest message with a jump-to-end button.",
      },
      source: {
        code: `<MessageScrollerProvider>
                 <MessageScroller>
                   <MessageScrollerViewport>
                     <MessageScrollerContent>
                       {messages.map((message, index) => (
                         <MessageScrollerItem
                           key={message.id}
                           scrollAnchor={index === messages.length - 1}
                         >
                           {/* styled message bubble */}
                         </MessageScrollerItem>
                       ))}
                     </MessageScrollerContent>
                   </MessageScrollerViewport>
                   <MessageScrollerButton direction="end" />
                 </MessageScroller>
               </MessageScrollerProvider>`,
      },
    },
  },
}

export const UnreadAnchor: Story = {
  render: () => (
    <DemoScroller
      anchorIndex={12}
      defaultScrollPosition="last-anchor"
      showStartButton
      showEndButton
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Anchors the initial viewport near an unread boundary in the middle of the conversation using defaultScrollPosition=\"last-anchor\".",
      },
    },
  },
}

export const JumpToStartOnly: Story = {
  render: () => <DemoScroller anchorIndex={messages.length - 1} showStartButton />,
  parameters: {
    docs: {
      description: {
        story:
          "Shows only the jump-to-start control for long threads where users primarily return to earlier context.",
      },
    },
  },
}

export const NoJumpButtons: Story = {
  render: () => <DemoScroller anchorIndex={messages.length - 1} />,
  parameters: {
    docs: {
      description: {
        story:
          "Renders the message feed without jump controls when start/end buttons are not needed.",
      },
    },
  },
}
