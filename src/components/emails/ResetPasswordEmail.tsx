
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
} from '@react-email/components';
import * as React from 'react';

interface ResetPasswordEmailProps {
  resetUrl: string;
  userEmail?: string;
}

export const ResetPasswordEmail = ({
  resetUrl,
  userEmail,
}: ResetPasswordEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your cosmic password and return to the stars</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>🔮 Password Reset 🔮</Heading>
        </Section>
        
        <Section style={content}>
          <Text style={greeting}>
            Greetings, cosmic traveler! 🌙
          </Text>
          
          <Text style={text}>
            It seems you've lost your way among the stars and need to reset 
            your password. Don't worry - even the most experienced astrologers 
            sometimes need to realign their cosmic keys!
          </Text>
          
          <Text style={text}>
            We received a request to reset the password for your account. 
            If this was you, click the button below to create a new password 
            and return to your celestial journey.
          </Text>
          
          <Section style={buttonContainer}>
            <Link href={resetUrl} style={button}>
              🌟 Reset My Password 🌟
            </Link>
          </Section>
          
          <Section style={warningBox}>
            <Text style={warningText}>
              <strong>🚨 Security Note:</strong><br />
              This link will expire in 24 hours for your protection. 
              If you didn't request this reset, you can safely ignore this email 
              - your account remains secure under the cosmic shield.
            </Text>
          </Section>
          
          <Text style={text}>
            Once you reset your password, you'll be back to:
          </Text>
          
          <Text style={listItem}>🌟 Discovering your astrological matches</Text>
          <Text style={listItem}>💫 Exploring cosmic compatibility</Text>
          <Text style={listItem}>🔮 Connecting with celestial souls</Text>
          
          <Text style={smallText}>
            If the button doesn't work, copy and paste this link into your browser:
          </Text>
          <Text style={linkText}>{resetUrl}</Text>
          
          <Text style={smallText}>
            <strong>Didn't request this?</strong> If you didn't ask to reset your password, 
            please ignore this email. Your account is safe and no changes have been made.
          </Text>
        </Section>
        
        <Section style={footer}>
          <Text style={footerText}>
            May the stars guide you safely back! 🌌
          </Text>
          <Text style={footerText}>
            With cosmic protection,<br />
            The Astro Dating Security Team
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
  background: 'linear-gradient(135deg, #f59e0b, #d97706, #92400e)',
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
  color: '#fbbf24',
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

const warningBox = {
  backgroundColor: '#dc2626',
  border: '2px solid #ef4444',
  borderRadius: '8px',
  padding: '15px',
  margin: '20px 0',
};

const warningText = {
  color: '#ffffff',
  fontSize: '14px',
  margin: '0',
  textAlign: 'center' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#f59e0b',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
  border: '2px solid #fbbf24',
  background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
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

export default ResetPasswordEmail;
