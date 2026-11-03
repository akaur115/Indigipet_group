
import React from 'react';

import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type {
  LegalDocumentData,
} from './legalDocuments';

type Props = {
  document: LegalDocumentData;
  onBack: () => void;
};

export default function LegalDocumentScreen({
  document,
  onBack,
}: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back to Settings">

          <Text style={styles.backArrow}>
            ‹
          </Text>
        </TouchableOpacity>

        <Text
          style={styles.headerTitle}
          numberOfLines={1}>

          {document.title ===
          'IndigiPet Privacy Policy'
            ? 'Privacy Policy'
            : 'Terms of Service'}
        </Text>
      </View>

      {/* DOCUMENT CONTENT */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}>

        <Text style={styles.title}>
          {document.title}
        </Text>

        <Text style={styles.date}>
          Effective date: {document.effectiveDate}
        </Text>

        {/* INTRODUCTION */}
        {document.intro.map(
          (paragraph, index) => (
            <Text
              style={styles.paragraph}
              key={'intro-' + index}>

              {paragraph}
            </Text>
          ),
        )}

        {/* ALL DOCUMENT SECTIONS */}
        {document.sections.map(
          (section, index) => (
            <View
              style={styles.section}
              key={section.heading + index}>

              <Text style={styles.sectionHeading}>
                {section.heading}
              </Text>

              {section.paragraphs.map(
                (paragraph, paragraphIndex) => (
                  <Text
                    key={paragraphIndex}
                    style={[
                      styles.paragraph,
                      paragraph.startsWith('• ') &&
                        styles.bullet,
                    ]}>

                    {paragraph}
                  </Text>
                ),
              )}

            </View>
          ),
        )}

        {/* RETURN BUTTON */}
        <TouchableOpacity
          style={styles.doneButton}
          onPress={onBack}
          accessibilityRole="button">

          <Text style={styles.doneButtonText}>
            Back to Settings
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBEF',
  },

  header: {
    backgroundColor: '#035643',
    minHeight: 75,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  backButton: {
    width: 36,
    height: 48,
    justifyContent: 'center',
  },

  backArrow: {
    fontSize: 34,
    color: '#FFFFFF',
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 8,
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom: 38,
  },

  title: {
    fontSize: 23,
    fontWeight: '800',
    color: '#173C33',
    marginBottom: 7,
  },

  date: {
    fontSize: 14,
    color: '#484139',
    fontWeight: '600',
    marginBottom: 18,
  },

  section: {
    marginTop: 16,
  },

  sectionHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#035643',
    marginBottom: 9,
  },

  paragraph: {
    color: '#292521',
    fontSize: 15.5,
    lineHeight: 24,
    marginBottom: 11,
  },

  bullet: {
    marginLeft: 12,
  },

  doneButton: {
    backgroundColor: '#089BA1',
    borderRadius: 9,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
  },

  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
