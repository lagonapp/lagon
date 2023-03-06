import { Button } from '@react-email/button';
import { Container } from '@react-email/container';
import { Head } from '@react-email/head';
import { Html } from '@react-email/html';
import { Img } from '@react-email/img';
import { Preview } from '@react-email/preview';
import { Section } from '@react-email/section';
import { Text } from '@react-email/text';
import { blue } from 'tailwindcss/colors';

type WelcomeProps = {
  name: string;
};

export function Welcome({ name }: WelcomeProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Welcome to Lagon, an open-source runtime and platform that allows developers to run TypeScript and JavaScript
        Serverless Functions at the Edge, close to users.
      </Preview>
      <Section style={main}>
        <Container style={container}>
          <Img src="https://dash.lagon.app/images/logo-black.png" width="170" height="50" alt="Lagon" style={logo} />
          <Text style={paragraph}>Hi {name},</Text>
          <Text style={paragraph}>
            Welcome to Lagon, an open-source runtime and platform that allows developers to run TypeScript and
            JavaScript Serverless Functions at the Edge, close to users.
          </Text>
          <Text style={paragraph}>
            We are excited to have you on board! Start your journey by deploying your first Function:
          </Text>
          <Section style={btnContainer}>
            <Button pX={14} pY={10} style={button} href="https://docs.lagon.app/get-started">
              Get started guide
            </Button>
          </Section>
          <Text style={paragraph}>
            See you soon,
            <br />
            Tom from Lagon
          </Text>
        </Container>
      </Section>
    </Html>
  );
}

const fontFamily =
  '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif';

const main = {
  backgroundColor: '#ffffff',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
};

const logo = {
  margin: '0 auto',
};

const paragraph = {
  fontFamily,
  fontSize: '16px',
  lineHeight: '26px',
};

const btnContainer = {
  textAlign: 'center' as const,
};

const button = {
  fontFamily,
  backgroundColor: blue[500],
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
};
