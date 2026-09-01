const HEURISTICS = [
  {
    id: 'nielsen-status', source: 'Nielsen', sourceShort: 'Nielsen', priority: 1,
    name: 'Visibility of system status', category: 'Feedback & System Behaviour',
    summary: 'Keep users informed about what is happening through appropriate, timely feedback.',
    lookFor: ['No indication that an action worked', 'Unclear loading or progress', 'System state is hidden or ambiguous'],
    example: 'A user submits a form and nothing changes for several seconds. They click the button again because there is no indication the request is being processed.',
    related: ['tognazzini-state','tognazzini-latency']
  },
  {
    id: 'nielsen-real-world', source: 'Nielsen', sourceShort: 'Nielsen', priority: 1,
    name: 'Match between system and the real world', category: 'Understanding & Cognition',
    summary: 'Speak the user’s language and use concepts and conventions familiar to them rather than internal system terminology.',
    lookFor: ['Technical or internal jargon', 'Unexpected terminology', 'Concepts that do not match users’ mental models'],
    example: 'A booking interface uses “resource allocation” where users expect a familiar term such as “reserve a room”.',
    related: ['budd-expectations','tognazzini-metaphors']
  },
  {
    id: 'nielsen-control', source: 'Nielsen', sourceShort: 'Nielsen', priority: 1,
    name: 'User control and freedom', category: 'User Agency',
    summary: 'Give users clear ways to leave unwanted states, undo actions, and control the direction of an interaction.',
    lookFor: ['No undo or cancel', 'Trapped states', 'Actions that are difficult to reverse'],
    example: 'A user opens an editor dialog but cannot cancel without losing the changes already entered.',
    related: ['tognazzini-autonomy','tognazzini-explore']
  },
  {
    id: 'nielsen-consistency', source: 'Nielsen', sourceShort: 'Nielsen', priority: 1,
    name: 'Consistency and standards', category: 'Understanding & Cognition',
    summary: 'Avoid making users wonder whether different words, situations, or actions mean the same thing; follow established conventions.',
    lookFor: ['Same action represented differently', 'Inconsistent terminology', 'Broken platform or interaction conventions'],
    example: 'The same primary action is labelled “Save” on one page and “Apply” on another even though it performs the same task.',
    related: ['budd-consistency']
  },
  {
    id: 'nielsen-prevention', source: 'Nielsen', sourceShort: 'Nielsen', priority: 1,
    name: 'Error prevention', category: 'Errors & Recovery',
    summary: 'Prevent problems before they occur through constraints, sensible defaults, confirmation and careful interaction design.',
    lookFor: ['Easy-to-make irreversible mistakes', 'Missing constraints', 'Ambiguous or unsafe actions'],
    example: 'A delete button is placed beside a commonly used control with no confirmation, making accidental deletion easy.',
    related: ['tognazzini-defaults','tognazzini-protect']
  },
  {
    id: 'nielsen-recognition', source: 'Nielsen', sourceShort: 'Nielsen', priority: 1,
    name: 'Recognition rather than recall', category: 'Understanding & Cognition',
    summary: 'Minimise memory load by keeping relevant information, actions and options visible or easily retrievable.',
    lookFor: ['Users must remember previous information', 'Hidden options', 'Interfaces that require memorising codes or steps'],
    example: 'A checkout asks users to manually re-enter an address they entered on the previous screen rather than displaying or selecting it.',
    related: ['budd-cognitive-load','tognazzini-discoverability']
  },
  {
    id: 'nielsen-flexibility', source: 'Nielsen', sourceShort: 'Nielsen', priority: 1,
    name: 'Flexibility and efficiency of use', category: 'Efficiency & Tasks',
    summary: 'Support both new and experienced users by allowing efficient paths, shortcuts and appropriate customisation.',
    lookFor: ['Repeated work', 'No shortcuts for frequent tasks', 'Rigid workflows that do not adapt to different experience levels'],
    example: 'A frequent user must complete five identical confirmation steps every time instead of being able to save a preference or use a shortcut.',
    related: ['budd-efficiency']
  },
  {
    id: 'nielsen-minimalist', source: 'Nielsen', sourceShort: 'Nielsen', priority: 1,
    name: 'Aesthetic and minimalist design', category: 'Experience & Quality',
    summary: 'Avoid irrelevant information. Every unnecessary element competes with information that matters to the user.',
    lookFor: ['Competing information', 'Unnecessary controls', 'Visual or informational clutter'],
    example: 'A task screen displays promotional banners and secondary statistics that distract users from the primary action they came to complete.',
    related: ['budd-complexity']
  },
  {
    id: 'nielsen-errors', source: 'Nielsen', sourceShort: 'Nielsen', priority: 1,
    name: 'Recognise, diagnose, and recover from errors', category: 'Errors & Recovery',
    summary: 'Explain errors in plain language, identify the problem precisely, and give users a constructive path to recovery.',
    lookFor: ['Generic error messages', 'Error codes without explanation', 'No guidance for recovery'],
    example: 'A payment fails with “Error 403” and gives the user no indication of what went wrong or what to try next.',
    related: ['budd-error-recovery']
  },
  {
    id: 'nielsen-help', source: 'Nielsen', sourceShort: 'Nielsen', priority: 1,
    name: 'Help and documentation', category: 'Learning & Support',
    summary: 'Provide focused help when the interface alone is not enough for users to understand or complete a task.',
    lookFor: ['Unexplained specialised features', 'No support for complex tasks', 'Help content that is difficult to find'],
    example: 'A financial application uses a specialist term for a setting but provides no explanation, example, or accessible help.',
    related: ['tognazzini-learnability']
  },

  {
    id: 'budd-expectations', source: 'Andy Budd', sourceShort: 'Budd', priority: 2,
    name: 'Design for user expectations', category: 'Understanding & Cognition',
    summary: 'Design interactions in ways that align with what users are likely to expect from prior experience and established patterns.',
    lookFor: ['Surprising behaviour', 'Conventions broken without reason', 'Actions that produce unexpected outcomes'],
    example: 'Users expect a logo to return them to the homepage, but on this site it opens a settings panel instead.',
    related: ['nielsen-real-world','nielsen-consistency']
  },
  {
    id: 'budd-clarity', source: 'Andy Budd', sourceShort: 'Budd', priority: 2,
    name: 'Clarity', category: 'Understanding & Cognition',
    summary: 'Make the purpose, meaning and consequences of an interaction understandable without unnecessary interpretation.',
    lookFor: ['Ambiguous controls', 'Unclear hierarchy', 'Users hesitating because meaning is uncertain'],
    example: 'A prominent icon has no label and its meaning is unclear to first-time users, who repeatedly hover or tap it trying to understand its purpose.',
    related: ['nielsen-minimalist','budd-cognitive-load']
  },
  {
    id: 'budd-cognitive-load', source: 'Andy Budd', sourceShort: 'Budd', priority: 2,
    name: 'Minimise unnecessary complexity and cognitive load', category: 'Understanding & Cognition',
    summary: 'Reduce mental effort that does not contribute to the user’s goal, especially where complexity can be handled by the system instead.',
    lookFor: ['Too many simultaneous decisions', 'Complex terminology', 'Processes that require unnecessary mental calculation'],
    example: 'A setup process presents twelve options at once when most users only need to choose between two common configurations.',
    related: ['nielsen-recognition','nielsen-minimalist']
  },
  {
    id: 'budd-efficiency', source: 'Andy Budd', sourceShort: 'Budd', priority: 2,
    name: 'Efficiency and task completion', category: 'Efficiency & Tasks',
    summary: 'Evaluate the interaction in terms of how effectively and efficiently users can achieve their actual goals.',
    lookFor: ['Unnecessary steps', 'Repeated input', 'Interaction effort that does not advance the task'],
    example: 'Users can technically complete a registration task, but must navigate through several screens to provide information that could have been collected more directly.',
    related: ['nielsen-flexibility']
  },
  {
    id: 'budd-context', source: 'Andy Budd', sourceShort: 'Budd', priority: 2,
    name: 'Provide users with context', category: 'Navigation & Context',
    summary: 'Help users understand where they are, where they came from, what they can do next and where they are in an ongoing process.',
    lookFor: ['Disorientation', 'Unclear progress', 'Pages without meaningful location or context'],
    example: 'A multi-step application form gives no indication of the current step, how many steps remain, or whether the user can return to earlier sections.',
    related: ['nielsen-status','tognazzini-state']
  },
  {
    id: 'budd-positive', source: 'Andy Budd', sourceShort: 'Budd', priority: 2,
    name: 'Promote a pleasurable and positive user experience', category: 'Experience & Quality',
    summary: 'Consider the quality of the experience beyond basic task completion, including confidence, comfort, satisfaction and emotional response.',
    lookFor: ['Friction that undermines confidence', 'Interactions that feel unnecessarily hostile or tedious', 'Opportunities to create a more reassuring experience'],
    example: 'A public service process technically works but uses threatening language and gives no reassurance when information has been successfully submitted.',
    related: ['nielsen-minimalist']
  },

  {
    id: 'tognazzini-anticipation', source: 'Bruce Tognazzini', sourceShort: 'Tog', priority: 3,
    name: 'Anticipation', category: 'Efficiency & Tasks',
    summary: 'Anticipate users’ needs and likely next actions so the system can reduce unnecessary effort.',
    lookFor: ['Repeated requests for predictable information', 'Missing context-sensitive actions', 'Systems that react only after users encounter a problem'],
    example: 'A travel booking service asks for a passenger’s details again even though the same information is already stored in the user profile.',
    related: ['budd-efficiency','tognazzini-defaults']
  },
  {
    id: 'tognazzini-autonomy', source: 'Bruce Tognazzini', sourceShort: 'Tog', priority: 3,
    name: 'Autonomy', category: 'User Agency',
    summary: 'Users should feel they remain in control of the interaction and that the system is responsive to their intentions.',
    lookFor: ['System behaviour that overrides user intent', 'Unwanted automatic actions', 'Lack of meaningful control'],
    example: 'A media interface automatically starts playing content with sound when a page loads, overriding the user’s decision about when to begin.',
    related: ['nielsen-control']
  },
  {
    id: 'tognazzini-defaults', source: 'Bruce Tognazzini', sourceShort: 'Tog', priority: 3,
    name: 'Defaults', category: 'Efficiency & Tasks',
    summary: 'Use sensible defaults to reduce effort while avoiding assumptions that create harmful or surprising outcomes.',
    lookFor: ['Poor default choices', 'Defaults that cause avoidable errors', 'Frequently repeated selections'],
    example: 'A form defaults to a country the user does not use and preselects an expensive delivery option that most users change.',
    related: ['nielsen-prevention','tognazzini-anticipation']
  },
  {
    id: 'tognazzini-discoverability', source: 'Bruce Tognazzini', sourceShort: 'Tog', priority: 3,
    name: 'Discoverability', category: 'Navigation & Context',
    summary: 'Make important actions and possibilities discoverable so users can understand what the system affords without guesswork.',
    lookFor: ['Hidden controls', 'Unsignposted capabilities', 'Users searching for what they can do'],
    example: 'A calendar supports dragging events to reschedule them, but there is no cue or feedback that this interaction is possible.',
    related: ['nielsen-recognition','budd-clarity']
  },
  {
    id: 'tognazzini-explore', source: 'Bruce Tognazzini', sourceShort: 'Tog', priority: 3,
    name: 'Explorable interfaces', category: 'User Agency',
    summary: 'Allow users to explore features and information without making experimentation unnecessarily risky.',
    lookFor: ['Fear of clicking', 'Irreversible exploration', 'Interfaces where users cannot safely try things'],
    example: 'A settings system applies destructive changes immediately with no preview, cancel option, or safe way to experiment.',
    related: ['nielsen-control','tognazzini-autonomy']
  },
  {
    id: 'tognazzini-fitts', source: 'Bruce Tognazzini', sourceShort: 'Tog', priority: 3,
    name: "Fitts's Law", category: 'Perception & Physical Interaction',
    summary: 'The time required to acquire a target is influenced by its size and distance; important interactive targets should be appropriately sized and placed.',
    lookFor: ['Tiny controls', 'Targets far from likely starting positions', 'Touch targets that are difficult to acquire'],
    example: 'A mobile interface places a small close icon in the far corner of the screen, making it difficult to hit accurately with one hand.',
    related: ['tognazzini-readability']
  },
  {
    id: 'tognazzini-latency', source: 'Bruce Tognazzini', sourceShort: 'Tog', priority: 3,
    name: 'Latency reduction', category: 'Feedback & System Behaviour',
    summary: 'Reduce waiting where possible and communicate unavoidable delays so users understand that the interaction is progressing.',
    lookFor: ['Long waits', 'No feedback during processing', 'Unnecessary network or interaction delays'],
    example: 'A search takes several seconds and shows a blank page during the delay, leading users to assume the request failed.',
    related: ['nielsen-status','tognazzini-state']
  },
  {
    id: 'tognazzini-learnability', source: 'Bruce Tognazzini', sourceShort: 'Tog', priority: 3,
    name: 'Learnability', category: 'Learning & Support',
    summary: 'Support users in becoming competent through understandable patterns, feedback and opportunities to learn by doing.',
    lookFor: ['Repeated confusion', 'Controls that never become easier to use', 'Interfaces that provide little feedback while users learn'],
    example: 'A specialist tool uses many unexplained controls and gives no feedback when users try them, making learning dependent on external training.',
    related: ['nielsen-help','budd-clarity']
  },
  {
    id: 'tognazzini-protect', source: 'Bruce Tognazzini', sourceShort: 'Tog', priority: 3,
    name: "Protect users' work", category: 'Errors & Recovery',
    summary: 'Protect the effort, data and progress users have invested in an interaction from accidental loss or system failure.',
    lookFor: ['Lost input', 'No autosave', 'Destructive recovery from crashes or navigation'],
    example: 'A long form loses all entered information when the user’s browser refreshes or the connection drops.',
    related: ['nielsen-prevention','nielsen-control']
  },
  {
    id: 'tognazzini-readability', source: 'Bruce Tognazzini', sourceShort: 'Tog', priority: 3,
    name: 'Readability', category: 'Perception & Physical Interaction',
    summary: 'Present information so it can be comfortably perceived and understood, considering typography, contrast, density and viewing conditions.',
    lookFor: ['Small or cramped text', 'Poor contrast', 'Dense information that is difficult to scan'],
    example: 'Instructions use low-contrast, small text in a dense block, causing users to skip important information.',
    related: ['nielsen-minimalist','budd-clarity']
  },
  {
    id: 'tognazzini-state', source: 'Bruce Tognazzini', sourceShort: 'Tog', priority: 3,
    name: 'State', category: 'Feedback & System Behaviour',
    summary: 'Maintain and communicate meaningful system and user state so the interaction remains coherent as people move through it.',
    lookFor: ['Lost position', 'Reset preferences', 'System state that is hidden or unexpectedly changes'],
    example: 'A shopping interface removes selected items after returning from checkout, forcing the user to reconstruct their previous state.',
    related: ['nielsen-status','budd-context']
  }
];
