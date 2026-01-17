import React from 'react';
import { View, ScrollView, TouchableOpacity, Linking } from 'react-native';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import Expandable from '@/components/Expandable';
import Section from '@/components/layout/Section';
import Icon from '@/components/Icon';
import { Button } from '@/components/Button';
import AnimatedView from '@/components/AnimatedView';

// FAQ data for reForma renovation app
const faqData = [
  {
    id: '1',
    question: 'How does the AI room renovation work?',
    answer: 'Upload a photo of your room, select your preferred style, wall finishes, flooring, and furniture options. Our AI will generate a photorealistic visualization of your renovated space, keeping the original room structure intact while applying your chosen design elements.'
  },
  {
    id: '2',
    question: 'How accurate are the renovation cost estimates?',
    answer: 'Our estimates are based on industry-standard rates and factor in your location, property type, condition, materials, and labor costs. While they provide a reliable ballpark figure, actual costs may vary by 10-20% depending on local contractor rates and unforeseen conditions.'
  },
  {
    id: '3',
    question: 'What is AR Room Scanning and how do I use it?',
    answer: 'AR Room Scanning uses your iPhone\'s LiDAR sensor to capture precise 3D measurements of your room. Simply point your camera at the room and slowly pan around. The app will automatically detect walls, doors, windows, and furniture, giving you accurate dimensions for cost estimation.'
  },
  {
    id: '4',
    question: 'Which devices support AR Room Scanning?',
    answer: 'AR Room Scanning requires an iPhone or iPad with a LiDAR sensor. This includes iPhone 12 Pro and later Pro models, and iPad Pro models from 2020 onwards. Other devices can still use manual dimension input for estimates.'
  },
  {
    id: '5',
    question: 'Can I add my own furniture or products to the AI design?',
    answer: 'Yes! In the design creation flow, you can upload photos of specific furniture, flooring samples, or decor items you\'ve purchased or are considering. The AI will incorporate these into your renovation visualization.'
  },
  {
    id: '6',
    question: 'How do I get the most accurate AI visualization?',
    answer: 'For best results: Take photos in good natural lighting, capture the room from a corner to show maximum space, keep the camera level, and be specific in your design instructions. The clearer your photo and descriptions, the better the AI output.'
  },
  {
    id: '7',
    question: 'What\'s included in the Bill of Quantities?',
    answer: 'The Bill of Quantities provides an itemized breakdown of all costs including materials (flooring, paint, tiles), labor (installation, preparation work), equipment, overhead, contingency for unexpected issues, and applicable taxes. You can view summary, category, or line-item details.'
  },
  {
    id: '8',
    question: 'Can I save and compare multiple design options?',
    answer: 'Yes! All your AI-generated designs are saved in "My Designs". You can create multiple versions of the same room with different styles and compare them side by side before deciding on your final renovation plan.'
  },
  {
    id: '9',
    question: 'How do location and property factors affect my estimate?',
    answer: 'Costs vary significantly by location (major cities typically cost more), property age (older buildings may need more prep work), current condition, access difficulty for workers and materials, and your project timeline. Our algorithm adjusts for all these factors.'
  },
  {
    id: '10',
    question: 'Is my data and photos secure?',
    answer: 'Yes, your privacy is our priority. Photos are processed securely and not shared with third parties. Your room scans and designs are stored privately in your account. You can delete your data at any time from Settings > Security & Privacy.'
  }
];

// Contact information for reForma
const contactInfo = [
  {
    id: 'email',
    type: 'Email Support',
    value: 'support@reforma.app',
    icon: 'Mail' as const,
    action: () => Linking.openURL('mailto:support@reforma.app')
  },
  {
    id: 'whatsapp',
    type: 'WhatsApp',
    value: 'Chat with our team',
    icon: 'MessageCircle' as const,
    action: () => Linking.openURL('https://wa.me/1234567890')
  },
  {
    id: 'hours',
    type: 'Support Hours',
    value: 'Mon-Fri, 9am-6pm CET',
    icon: 'Clock' as const,
    action: undefined
  }
];

export default function HelpScreen() {
  return (
    <View className="flex-1 bg-background dark:bg-dark-primary">
      <Header title="Help & Support" showBackButton />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <AnimatedView animation="fadeIn" duration={400}>
          {/* FAQ Section */}
          <Section 
            title="Frequently Asked Questions" 
            titleSize="xl" 
            className="px-global pt-6 pb-2"
          />
          
          <View className="px-global">
            {faqData.map((faq) => (
              <Expandable 
                key={faq.id}
                title={faq.question}
                className="py-1"
              >
                <ThemedText className="text-light-text dark:text-dark-text leading-6">
                  {faq.answer}
                </ThemedText>
              </Expandable>
            ))}
          </View>
          

          
          {/* Contact Section */}
          <Section 
            title="Contact Us" 
            titleSize="xl" 
            className="px-global pb-2 mt-14"
            subtitle="We're here to help with your renovation questions"
          />
          
          <View className="px-global pb-8">
            {contactInfo.map((contact) => (
              <TouchableOpacity 
                key={contact.id}
                onPress={contact.action}
                disabled={!contact.action}
                className="flex-row items-center py-4 border-b border-border"
              >
                <View className="w-10 h-10 rounded-full items-center justify-center mr-4" style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>
                  <Icon name={contact.icon} size={20} />
                </View>
                <View>
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                    {contact.type}
                  </ThemedText>
                  <ThemedText className="font-medium">
                    {contact.value}
                  </ThemedText>
                </View>
                {contact.action && (
                  <Icon name="ChevronRight" size={20} className="ml-auto text-light-subtext dark:text-dark-subtext" />
                )}
              </TouchableOpacity>
            ))}
            
            <Button 
              title="Contact Support" 
              iconStart="Mail"
              className="mt-8"
              onPress={() => Linking.openURL('mailto:support@reforma.app')}
            />
          </View>
        </AnimatedView>
      </ScrollView>
    </View>
  );
}
