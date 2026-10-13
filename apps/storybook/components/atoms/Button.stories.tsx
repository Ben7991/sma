import { Button,  } from "@repo/ui/atoms/button";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "components/atoms/Button",
  component: Button,
  tags: ["autodocs"],
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Click me",
  },
};
