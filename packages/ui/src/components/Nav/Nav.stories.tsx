import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Button, Nav } from '../';

export default {
  component: Nav,
} as ComponentMeta<typeof Nav>;

export const Default: ComponentStory<typeof Nav> = () => (
  <Nav defaultValue="first">
    <Nav.List>
      <Nav.Link value="first">First</Nav.Link>
      <Nav.Link value="second">Second</Nav.Link>
    </Nav.List>
    <Nav.Content value="first">First content</Nav.Content>
    <Nav.Content value="second">Second content</Nav.Content>
  </Nav>
);

export const DefaultValue: ComponentStory<typeof Nav> = () => (
  <Nav defaultValue="second">
    <Nav.List>
      <Nav.Link value="first">First</Nav.Link>
      <Nav.Link value="second">Second</Nav.Link>
    </Nav.List>
    <Nav.Content value="first">First content</Nav.Content>
    <Nav.Content value="second">Second content</Nav.Content>
  </Nav>
);

export const RightItem: ComponentStory<typeof Nav> = () => (
  <Nav defaultValue="first">
    <Nav.List rightItem={<Button>Right item</Button>}>
      <Nav.Link value="first">First</Nav.Link>
      <Nav.Link value="second">Second</Nav.Link>
    </Nav.List>
    <Nav.Content value="first">First content</Nav.Content>
    <Nav.Content value="second">Second content</Nav.Content>
  </Nav>
);
