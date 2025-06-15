
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Img,
} from '@react-email/components';
import * as React from 'react';

interface ConfirmSignUpEmailProps {
  confirmationUrl: string;
  userEmail?: string;
}

export const ConfirmSignUpEmail = ({
  confirmationUrl,
  userEmail,
}: ConfirmSignUpEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to your cosmic journey! Confirm your account</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>✨ Welcome to the Cosmos ✨</Heading>
        </Section>
        
        <Section style={content}>
          <Text style={greeting}>
            Hello cosmic soul! 🌟
          </Text>
          
          <Text style={text}>
            You're one step away from discovering your astrological match! 
            The stars have aligned to bring you here, and we're excited to help you 
            find your perfect cosmic connection.
          </Text>
          
          <Text style={text}>
            To complete your registration and start your celestial dating journey, 
            please confirm your email address by clicking the button below:
          </Text>
          
          <Section style={buttonContainer}>
            <Link href={confirmationUrl} style={button}>
              🌙 Confirm Your Account 🌙
            </Link>
          </Section>
          
          <Text style={text}>
            Once confirmed, you'll be able to:
          </Text>
          
          <Text style={listItem}>🌟 Create your detailed astrological profile</Text>
          <Text style={listItem}>💫 Discover compatibility scores based on birth charts</Text>
          <Text style={listItem}>🔮 Connect with cosmically aligned matches</Text>
          
          <Text style={smallText}>
            If the button doesn't work, copy and paste this link into your browser:
          </Text>
          <Text style={linkText}>{confirmationUrl}</Text>
        </Section>
        
        <Section style={footer}>
          <Text style={footerText}>
            The universe is waiting for you! 🌌
          </Text>
          <Text style={footerText}>
            With cosmic love,<br />
            The Astro Dating Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#0f0f23',
  fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px',
  maxWidth: '600px',
  backgroundColor: '#1a1a2e',
  borderRadius: '12px',
  border: '1px solid #4c1d95',
};

const header = {
  textAlign: 'center' as const,
  padding: '20px 0',
  background: 'linear-gradient(135deg, #7c3aed, #3b82f6, #6366f1)',
  borderRadius: '8px',
  marginBottom: '30px',
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  textAlign: 'center' as const,
};

const content = {
  padding: '0 20px',
};

const greeting = {
  color: '#c084fc',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 20px 0',
};

const text = {
  color: '#e2e8f0',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '16px 0',
};

const listItem = {
  color: '#e2e8f0',
  fontSize: '14px',
  margin: '8px 0',
  paddingLeft: '10px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#7c3aed',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
  border: '2px solid #a855f7',
  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
};

const smallText = {
  color: '#94a3b8',
  fontSize: '14px',
  margin: '20px 0 10px 0',
};

const linkText = {
  color: '#60a5fa',
  fontSize: '14px',
  wordBreak: 'break-all' as const,
  margin: '0 0 20px 0',
};

const footer = {
  textAlign: 'center' as const,
  padding: '30px 20px 20px',
  borderTop: '1px solid #374151',
  marginTop: '30px',
};

const footerText = {
  color: '#9ca3af',
  fontSize: '14px',
  margin: '8px 0',
};

export default ConfirmSignUpEmail;
