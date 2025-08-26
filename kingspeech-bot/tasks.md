# KingSpeech Bot - Landing Project

## Task Overview
**Project**: KingSpeech English School Bot  
**Location**: `C:\ESSENTIALS\PythonBots\landing`  
**Type**: Sales Funnel Bot with Course Matching  
**Complexity**: Level 3 (Feature)  
**Status**: PLANNING

## Requirements Analysis

### Business Requirements
1. **Sales Funnel**: Modern, non-pushy sales funnel for English courses
2. **Course Matching**: Intelligent course recommendation based on user goals/level
3. **Free Materials**: Delivery of free educational materials
4. **Multi-language**: Russian interface with English option
5. **Lead Generation**: Contact collection and manager handoff
6. **Analytics**: Comprehensive funnel tracking and conversion metrics

### Functional Requirements
1. **User Journey**: Greeting → Goal Selection → Qualification → Course Match → Soft CTA → Contact Collection → Free Materials → Thank You
2. **Course Database**: Structured course catalog with matching logic
3. **Materials Library**: Free PDFs/materials organized by goal/level
4. **Contact Forms**: Phone/Telegram/Email collection with consent
5. **Manager Notifications**: Lead alerts and handoff procedures
6. **Progress Tracking**: User journey progress indicators

### Technical Requirements
1. **Template Integration**: Use SimplePoll Bot Template as foundation
2. **Landing Integration**: Embed as website widget/chat
3. **Data Export**: Google Sheets integration for leads
4. **File Delivery**: Secure file sharing system
5. **Analytics Events**: Comprehensive event tracking
6. **Responsive Design**: Mobile-friendly interface

## Architecture Considerations

### Template Adaptation
- **Base**: SimplePoll Bot Template (modular, service-based)
- **Customization**: Sales funnel steps, course matching logic
- **Extensions**: Materials delivery, analytics tracking
- **Integration**: Landing page widget/chat interface

### Data Model
```python
# User Context
class Context:
    user_id: str
    goal: str  # study, exams, kids, business, travel, other
    level: str  # A0, A1, A2, B1, B2, C1, unknown
    format: str  # online, offline, hybrid
    schedule: str  # weekday, evening, weekend
    contact_info: Dict[str, str]
    consent: bool
    materials_requested: List[str]
    funnel_progress: int

# Course Model
class Course:
    id: str
    name: str
    goal: List[str]
    level: str
    format: str
    duration: str
    price: str
    description: str
    benefits: List[str]

# Material Model
class Material:
    id: str
    name: str
    goal: List[str]
    level: str
    file_url: str
    description: str
```

## Implementation Strategy

### Phase 1: Template Setup & Core Structure
1. **Project Initialization**: Copy SimplePoll template to landing project
2. **Core Services**: Adapt existing services for sales funnel
3. **Basic Steps**: Create initial dialogue steps structure
4. **Localization**: Set up Russian/English localization

### Phase 2: Sales Funnel Implementation
1. **Dialogue Steps**: Implement all sales funnel steps
2. **Course Matching**: Build course recommendation logic
3. **Materials System**: Create materials delivery system
4. **Contact Collection**: Implement lead generation forms

### Phase 3: Integration & Analytics
1. **Landing Integration**: Widget/chat interface setup
2. **Analytics Events**: Comprehensive tracking implementation
3. **Manager Notifications**: Lead handoff system
4. **Testing & Optimization**: End-to-end testing

## Components Affected

### New Components
- `steps/greeting.py` - Welcome and goal selection
- `steps/qualification.py` - Level and format assessment
- `steps/course_match.py` - Course recommendation logic
- `steps/objections.py` - Soft objection handling
- `steps/contacts_consent.py` - Lead collection
- `steps/free_materials.py` - Materials delivery
- `steps/booking_chat.py` - Trial booking/manager chat
- `steps/thank_you.py` - Completion and next steps

### Services to Extend
- `services/course_service.py` - Course matching and management
- `services/materials_service.py` - File delivery system
- `services/analytics_service.py` - Event tracking
- `services/landing_service.py` - Website integration

### Configuration Files
- `courses.json` - Course catalog
- `materials.json` - Materials library
- `analytics_events.json` - Event definitions
- `settings.json` - Sales funnel configuration

## Detailed Implementation Steps

### Step 1: Project Setup
1. Create landing project directory
2. Copy SimplePoll template structure
3. Update configuration for KingSpeech
4. Set up localization files (ru/en)
5. Configure Google Sheets for leads

### Step 2: Core Services Development
1. Implement CourseService with matching logic
2. Create MaterialsService for file delivery
3. Build AnalyticsService for event tracking
4. Develop LandingService for website integration

### Step 3: Dialogue Steps Implementation
1. Create greeting step with goal selection
2. Implement qualification step (level/format)
3. Build course matching step with recommendations
4. Add soft objection handling
5. Create contact collection with consent
6. Implement materials delivery system
7. Build booking/chat handoff
8. Create thank you completion step

### Step 4: Content & Configuration
1. Populate course catalog (courses.json)
2. Set up materials library (materials.json)
3. Configure analytics events
4. Create localization content
5. Set up sales funnel settings

### Step 5: Integration & Testing
1. Implement landing page widget
2. Set up manager notifications
3. Configure analytics tracking
4. End-to-end testing
5. Performance optimization

## Dependencies

### External Dependencies
- **Google Sheets API**: Lead data storage
- **File Storage**: Materials delivery (Drive/S3)
- **Landing Page**: Website integration
- **Analytics Platform**: Event tracking

### Internal Dependencies
- **SimplePoll Template**: Base architecture
- **Localization System**: Multi-language support
- **Settings Service**: Dynamic configuration
- **Sheets Service**: Data export

## Challenges & Mitigations

### Challenge 1: Course Matching Logic
- **Risk**: Complex matching algorithm
- **Mitigation**: Start with simple rule-based matching, iterate

### Challenge 2: Materials Delivery
- **Risk**: File storage and delivery complexity
- **Mitigation**: Use Google Drive API initially, optimize later

### Challenge 3: Landing Integration
- **Risk**: Widget/chat interface complexity
- **Mitigation**: Start with simple iframe/chat widget

### Challenge 4: Analytics Implementation
- **Risk**: Event tracking complexity
- **Mitigation**: Use simple event logging, integrate analytics later

## Creative Phase Components

### 🎨 UI/UX Design
- **Sales Funnel Flow**: User journey optimization
- **Progress Indicators**: Visual progress tracking
- **CTA Design**: Non-pushy call-to-action buttons
- **Materials Presentation**: Attractive materials catalog

### 🏗️ Architecture Design
- **Course Matching Algorithm**: Intelligent recommendation logic
- **Materials Delivery System**: Secure file sharing architecture
- **Analytics Event Schema**: Comprehensive tracking structure

### ⚙️ Algorithm Design
- **Course Recommendation Engine**: Goal/level matching logic
- **Funnel Optimization**: Conversion rate optimization
- **Lead Scoring**: Qualification and prioritization

## Testing Strategy

### Unit Tests
- Course matching logic
- Materials delivery system
- Analytics event tracking
- Localization fallback

### Integration Tests
- Complete sales funnel flow
- Google Sheets integration
- File delivery system
- Manager notifications

### User Acceptance Tests
- End-to-end user journey
- Mobile responsiveness
- Cross-browser compatibility
- Performance testing

## Success Metrics

### Conversion Metrics
- Funnel completion rate
- Contact submission rate
- Materials download rate
- Trial booking rate

### User Experience Metrics
- Session duration
- Step completion rates
- Drop-off points
- User satisfaction

### Business Metrics
- Lead quality
- Cost per lead
- Conversion to customer
- Revenue attribution

## Next Steps

1. **Complete Planning**: Finalize implementation plan
2. **Creative Phase**: Design UI/UX and algorithms
3. **Implementation**: Build core functionality
4. **Testing**: Comprehensive testing suite
5. **Deployment**: Landing page integration
6. **Optimization**: Performance and conversion optimization

**Status**: PLANNING COMPLETE  
**Next Mode**: CREATIVE (UI/UX Design, Algorithm Design)  
**Estimated Duration**: 2-3 weeks
