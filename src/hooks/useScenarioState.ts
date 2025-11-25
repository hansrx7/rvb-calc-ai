import { useReducer } from 'react';

// State interface
export interface ScenarioState {
  // Scenario data
  scenarioData: {
    homePrice: number;
    rent: number;
    downPayment: number;
    timeline: number;
    zipCode: string | null;
    mlPredicted: boolean;
    location: string | null; // e.g., "Poway, CA"
  };
  
  // UI state
  ui: {
    loading: boolean;
    loadingMessage: string;
    showCharts: boolean;
    showAdvancedCharts: boolean;
    editMode: boolean;
    showRecommendation: boolean;
  };
  
  // Analysis data
  analysis: {
    data: any | null;
    recommendation: any | null;
    error: string | null;
  };
  
  // Messages
  messages: Array<{
    id: string;
    sender: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  
  // Charts
  charts: Array<{
    id: string;
    type: string;
    data: any;
    visible: boolean;
  }>;
}

// Action types
export type ScenarioAction =
  | { type: 'SET_SCENARIO_DATA'; payload: Partial<ScenarioState['scenarioData']> }
  | { type: 'SET_LOADING'; payload: { loading: boolean; message?: string } }
  | { type: 'SET_ANALYSIS_DATA'; payload: any }
  | { type: 'SET_RECOMMENDATION'; payload: any }
  | { type: 'ADD_MESSAGE'; payload: { sender: 'user' | 'assistant'; content: string } }
  | { type: 'SHOW_RECOMMENDATION' }
  | { type: 'SHOW_CHARTS' }
  | { type: 'TOGGLE_ADVANCED_CHARTS' }
  | { type: 'TOGGLE_EDIT_MODE' }
  | { type: 'ADD_CHART'; payload: { type: string; data: any } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET_ALL' };

// Initial state
const initialState: ScenarioState = {
  scenarioData: {
    homePrice: 0,
    rent: 0,
    downPayment: 0,
    timeline: 0,
    zipCode: null,
    mlPredicted: false,
    location: null,
  },
  ui: {
    loading: false,
    loadingMessage: '',
    showCharts: false,
    showAdvancedCharts: false,
    editMode: false,
    showRecommendation: false,
  },
  analysis: {
    data: null,
    recommendation: null,
    error: null,
  },
  messages: [],
  charts: [],
};

// Reducer function
function scenarioReducer(state: ScenarioState, action: ScenarioAction): ScenarioState {
  switch (action.type) {
    case 'SET_SCENARIO_DATA':
      return {
        ...state,
        scenarioData: { ...state.scenarioData, ...action.payload }
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: action.payload.loading,
          loadingMessage: action.payload.message || ''
        }
      };
    
    case 'SET_ANALYSIS_DATA':
      return {
        ...state,
        analysis: {
          ...state.analysis,
          data: action.payload,
          error: null
        },
        ui: {
          ...state.ui,
          loading: false
        }
      };
    
    case 'SET_RECOMMENDATION':
      return {
        ...state,
        analysis: {
          ...state.analysis,
          recommendation: action.payload
        }
      };
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: Date.now().toString(),
            sender: action.payload.sender,
            content: action.payload.content,
            timestamp: new Date()
          }
        ]
      };
    
    case 'SHOW_RECOMMENDATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          showRecommendation: true
        }
      };
    
    case 'SHOW_CHARTS':
      return {
        ...state,
        ui: {
          ...state.ui,
          showCharts: true
        }
      };
    
    case 'TOGGLE_ADVANCED_CHARTS':
      return {
        ...state,
        ui: {
          ...state.ui,
          showAdvancedCharts: !state.ui.showAdvancedCharts
        }
      };
    
    case 'TOGGLE_EDIT_MODE':
      return {
        ...state,
        ui: {
          ...state.ui,
          editMode: !state.ui.editMode
        }
      };
    
    case 'ADD_CHART':
      return {
        ...state,
        charts: [
          ...state.charts,
          {
            id: Date.now().toString(),
            type: action.payload.type,
            data: action.payload.data,
            visible: true
          }
        ]
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        analysis: {
          ...state.analysis,
          error: action.payload
        },
        ui: {
          ...state.ui,
          loading: false
        }
      };
    
    case 'RESET_ALL':
      return initialState;
    
    default:
      return state;
  }
}

// Custom hook
export function useScenarioState() {
  const [state, dispatch] = useReducer(scenarioReducer, initialState);
  return { state, dispatch };
}

