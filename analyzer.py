import os
import json
from typing import Dict, List, Tuple, Optional, Set
from dataclasses import dataclass
from neo4j import GraphDatabase
import networkx as nx
from collections import defaultdict, Counter
import re
import google.generativeai as genai
import streamlit as st
import plotly.graph_objects as go
from datetime import datetime
from main import AgentThinkingKG
import pandas as pd

# Configure Gemini API
genai.configure(api_key="")

# Configure page
st.set_page_config(
    page_title="Agent Reasoning Analyzer",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS for dark mode and styling
st.markdown("""
<style>
    .stApp {
        background-color: #1E1E1E;
        color: #FFFFFF;
    }
    .chat-message {
        padding: 1.5rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        display: flex;
        flex-direction: column;
    }
    .chat-message.user {
        background-color: #2B2B2B;
    }
    .chat-message.assistant {
        background-color: #1A1A1A;
    }
    .chat-message .content {
        display: flex;
        flex-direction: column;
    }
    .stTextInput>div>div>input {
        background-color: #2B2B2B;
        color: #FFFFFF;
    }
    .stButton>button {
        background-color: #4A90E2;
        color: white;
    }
    .stButton>button:hover {
        background-color: #357ABD;
    }
    .analysis-container {
        background-color: #2B2B2B;
        padding: 1rem;
        border-radius: 0.5rem;
        margin-top: 1rem;
    }
    .graph-container {
        background-color: #2B2B2B;
        padding: 1rem;
        border-radius: 0.5rem;
        margin-top: 1rem;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'messages' not in st.session_state:
    st.session_state.messages = []
if 'kg_system' not in st.session_state:
    st.session_state.kg_system = AgentThinkingKG()
if 'last_session_id' not in st.session_state:
    st.session_state.last_session_id = None

@dataclass
class ReasoningPath:
    """Represents a reasoning path with its quality metrics"""
    session_id: str
    thought_sequence: List[str]
    thought_types: List[str]
    confidence_scores: List[float]
    path_length: int
    success_indicators: List[str]
    mistake_count: int
    backtrack_count: int
    tool_usage: List[str]
    overall_score: float
    implicit_issues: List[str]  # New field for implicit problems
    critique: Optional[str] = None  # AI-generated critique


@dataclass
class PathOptimization:
    """Contains optimization suggestions for reasoning paths"""
    original_path: ReasoningPath
    suggested_improvements: List[str]
    alternative_path: Optional[ReasoningPath]
    confidence_in_suggestion: float
    reasoning: str
    ai_critique: Optional[str] = None  # New field for AI critique


class EnhancedReasoningMistakeDetector:
    """Detects both explicit and implicit reasoning mistakes"""

    def __init__(self):
        self.model = genai.GenerativeModel('gemini-1.5-flash')

        # Explicit mistake patterns (original)
        self.mistake_patterns = [
            r'on second thought',
            r'actually',
            r'wait',
            r'no[,\s]',
            r'incorrect',
            r'wrong',
            r'mistake',
            r'error',
            r'oops',
            r'sorry',
            r'let me reconsider',
            r'I was wrong',
            r'that\'s not right',
            r'correction',
            r'revise'
        ]

        # Patterns indicating uncertainty
        self.uncertainty_patterns = [
            r'maybe',
            r'perhaps',
            r'might',
            r'could be',
            r'not sure',
            r'uncertain',
            r'possibly',
            r'I think'
        ]

        # Patterns indicating high confidence
        self.confidence_patterns = [
            r'clearly',
            r'obviously',
            r'definitely',
            r'certainly',
            r'without doubt',
            r'I\'m confident',
            r'sure that',
            r'determined that'
        ]

        # New patterns for implicit issues
        self.overthinking_patterns = [
            r'but then again',
            r'on the other hand',
            r'alternatively',
            r'or maybe',
            r'but what if',
            r'unless',
            r'although',
            r'however',
            r'but I remember',
            r'given all this'
        ]

        self.circular_reasoning_patterns = [
            r'but if I already',
            r'why do I need to confirm',
            r'that seems circular',
            r'back to',
            r'again'
        ]

        self.analysis_paralysis_patterns = [
            r'I should first',
            r'maybe I should',
            r'perhaps I should',
            r'to be safe',
            r'just to make sure',
            r'I can\'t rule out',
            r'unless I\'ve',
            r'might just be'
        ]

    def analyze_thought_quality(self, thought_content: str, confidence_score: float) -> Dict[str, any]:
        """Analyze a single thought for quality indicators (enhanced)"""
        content_lower = thought_content.lower()

        # Original explicit mistake detection
        mistake_count = sum(1 for pattern in self.mistake_patterns
                            if re.search(pattern, content_lower))

        uncertainty_count = sum(1 for pattern in self.uncertainty_patterns
                                if re.search(pattern, content_lower))

        confidence_count = sum(1 for pattern in self.confidence_patterns
                               if re.search(pattern, content_lower))

        # New implicit issue detection
        overthinking_count = sum(1 for pattern in self.overthinking_patterns
                                 if re.search(pattern, content_lower))

        circular_reasoning_count = sum(1 for pattern in self.circular_reasoning_patterns
                                       if re.search(pattern, content_lower))

        analysis_paralysis_count = sum(1 for pattern in self.analysis_paralysis_patterns
                                       if re.search(pattern, content_lower))

        # Detect implicit issues
        implicit_issues = []
        if overthinking_count >= 2:
            implicit_issues.append("overthinking")
        if circular_reasoning_count > 0:
            implicit_issues.append("circular_reasoning")
        if analysis_paralysis_count >= 2:
            implicit_issues.append("analysis_paralysis")

        # Enhanced confidence adjustment
        adjusted_confidence = confidence_score
        if mistake_count > 0:
            adjusted_confidence *= 0.3
        elif overthinking_count >= 2:
            adjusted_confidence *= 0.5  # Overthinking penalty
        elif circular_reasoning_count > 0:
            adjusted_confidence *= 0.4  # Circular reasoning penalty
        elif analysis_paralysis_count >= 2:
            adjusted_confidence *= 0.6  # Analysis paralysis penalty
        elif uncertainty_count > confidence_count:
            adjusted_confidence *= 0.7
        elif confidence_count > 0:
            adjusted_confidence = min(1.0, adjusted_confidence * 1.2)

        return {
            'mistake_indicators': mistake_count,
            'uncertainty_indicators': uncertainty_count,
            'confidence_indicators': confidence_count,
            'overthinking_indicators': overthinking_count,
            'circular_reasoning_indicators': circular_reasoning_count,
            'analysis_paralysis_indicators': analysis_paralysis_count,
            'adjusted_confidence': adjusted_confidence,
            'is_mistake': mistake_count > 0,
            'is_uncertain': uncertainty_count > confidence_count,
            'implicit_issues': implicit_issues
        }

    def generate_ai_critique(self, thought_sequence: List[str], session_context: str = "") -> str:
        """Use Gemini to generate intelligent critique of reasoning process"""

        full_reasoning = "\n".join([f"Step {i + 1}: {thought}" for i, thought in enumerate(thought_sequence)])

        critique_prompt = f"""
        Analyze this agent's reasoning process and provide constructive critique for improvement:

        REASONING TRACE:
        {full_reasoning}

        CONTEXT: {session_context}

        Please provide a critique that focuses on:
        1. **Efficiency Issues**: Does the agent overthink simple problems?
        2. **Directness**: Could the agent reach the goal more directly?
        3. **Circular Logic**: Are there unnecessary loops in reasoning?
        4. **Analysis Paralysis**: Does the agent get stuck considering too many options?
        5. **Tool Usage**: Are tools used efficiently or redundantly?
        6. **Decision Making**: Does the agent make clear decisions or waffle?

        Provide your critique in this format:
        MAIN_ISSUES: [List 2-3 key problems]
        RECOMMENDATION: [One clear actionable advice for next time]
        EXAMPLE_IMPROVEMENT: [Show how one part could be reasoned better]

        Keep it concise but actionable - this will be used to improve the agent's future reasoning.
        """

        try:
            response = self.model.generate_content(critique_prompt)
            return response.text.strip()
        except Exception as e:
            return f"Could not generate AI critique: {e}"

    def analyze_reasoning_efficiency(self, thought_sequence: List[str]) -> Dict[str, any]:
        """Analyze overall reasoning efficiency and identify improvement areas"""

        full_text = " ".join(thought_sequence)

        # Count decision points vs. analysis
        decision_words = len(re.findall(r'\b(will|should|must|need to|going to|decide)\b', full_text.lower()))
        analysis_words = len(
            re.findall(r'\b(consider|maybe|perhaps|might|could|possibly|alternatively)\b', full_text.lower()))

        # Count questions (often indicate uncertainty/overthinking)
        question_count = full_text.count('?')

        # Count conditional statements (complexity indicators)
        conditional_count = len(re.findall(r'\b(if|unless|although|however|but)\b', full_text.lower()))

        # Calculate efficiency metrics
        decision_ratio = decision_words / max(1, decision_words + analysis_words)
        complexity_score = (question_count + conditional_count) / len(thought_sequence)

        efficiency_issues = []
        if decision_ratio < 0.3:
            efficiency_issues.append("low_decision_ratio")
        if complexity_score > 2:
            efficiency_issues.append("high_complexity")
        if question_count > len(thought_sequence):
            efficiency_issues.append("excessive_questioning")

        return {
            'decision_ratio': decision_ratio,
            'complexity_score': complexity_score,
            'question_count': question_count,
            'conditional_count': conditional_count,
            'efficiency_issues': efficiency_issues,
            'efficiency_score': max(0, 1 - complexity_score * 0.2) * decision_ratio
        }


class OptimalReasoningAnalyzer:
    """Enhanced analyzer with implicit mistake detection and AI critique"""

    def __init__(self, neo4j_uri: str = None, neo4j_user: str = None,
                 neo4j_password: str = None):
        # Database connection
        self.neo4j_uri = neo4j_uri or os.getenv('NEO4J_URI', 'bolt://localhost:7687')
        self.neo4j_user = neo4j_user or os.getenv('NEO4J_USER', 'neo4j')
        self.neo4j_password = neo4j_password or os.getenv('NEO4J_PASSWORD', 'admin456')

        self.driver = GraphDatabase.driver(
            self.neo4j_uri, auth=(self.neo4j_user, self.neo4j_password)
        )

        self.mistake_detector = EnhancedReasoningMistakeDetector()

    def extract_reasoning_paths(self) -> List[ReasoningPath]:
        """Extract all reasoning paths from the knowledge graph (enhanced)"""
        paths = []

        with self.driver.session() as session:
            result = session.run("""
                MATCH (s:Session)-[:CONTAINS]->(t:Thought)
                WITH s, t ORDER BY t.sequence_order
                RETURN s.id as session_id,
                       s.reasoning_strategy as strategy,
                       s.success_indicators as success_indicators,
                       s.domain as domain,
                       collect(t.content) as thoughts,
                       collect(t.type) as thought_types,
                       collect(t.confidence) as confidences,
                       collect(t.id) as thought_ids
            """)

            for record in result:
                session_data = record.data()

                # Get tool usage for this session
                tools = self._get_session_tools(session_data['session_id'])

                # Enhanced mistake analysis (explicit + implicit)
                mistake_analysis = self._analyze_session_mistakes_enhanced(
                    session_data['thoughts'],
                    session_data['confidences']
                )

                # Generate AI critique for this reasoning path
                context = f"Domain: {session_data.get('domain', 'unknown')}, Strategy: {session_data.get('strategy', 'unknown')}"
                ai_critique = self.mistake_detector.generate_ai_critique(
                    session_data['thoughts'],
                    context
                )

                # Calculate overall path score (enhanced)
                overall_score = self._calculate_path_score_enhanced(
                    session_data['confidences'],
                    mistake_analysis['mistake_count'],
                    mistake_analysis['backtrack_count'],
                    len(session_data['success_indicators'] or []),
                    len(tools),
                    mistake_analysis['implicit_issue_count'],
                    mistake_analysis['efficiency_score']
                )

                path = ReasoningPath(
                    session_id=session_data['session_id'],
                    thought_sequence=session_data['thoughts'],
                    thought_types=session_data['thought_types'],
                    confidence_scores=session_data['confidences'],
                    path_length=len(session_data['thoughts']),
                    success_indicators=session_data['success_indicators'] or [],
                    mistake_count=mistake_analysis['mistake_count'],
                    backtrack_count=mistake_analysis['backtrack_count'],
                    tool_usage=tools,
                    overall_score=overall_score,
                    implicit_issues=mistake_analysis['implicit_issues'],
                    critique=ai_critique
                )

                paths.append(path)

        return paths

    def _analyze_session_mistakes_enhanced(self, thoughts: List[str], confidences: List[float]) -> Dict[str, any]:
        """Enhanced mistake analysis including implicit issues"""
        mistake_count = 0
        backtrack_count = 0
        all_implicit_issues = []

        for i, thought in enumerate(thoughts):
            analysis = self.mistake_detector.analyze_thought_quality(thought, confidences[i])

            if analysis['is_mistake']:
                mistake_count += 1

                # Check if this leads to backtracking
                if i < len(thoughts) - 1:
                    next_thoughts = thoughts[i + 1:min(i + 3, len(thoughts))]
                    if any('reconsider' in t.lower() or 'instead' in t.lower()
                           for t in next_thoughts):
                        backtrack_count += 1

            # Collect implicit issues
            all_implicit_issues.extend(analysis['implicit_issues'])

        # Analyze overall reasoning efficiency
        efficiency_analysis = self.mistake_detector.analyze_reasoning_efficiency(thoughts)

        return {
            'mistake_count': mistake_count,
            'backtrack_count': backtrack_count,
            'implicit_issues': list(set(all_implicit_issues)),
            'implicit_issue_count': len(all_implicit_issues),
            'efficiency_score': efficiency_analysis['efficiency_score'],
            'efficiency_issues': efficiency_analysis['efficiency_issues']
        }

    def _calculate_path_score_enhanced(self, confidences: List[float], mistake_count: int,
                                       backtrack_count: int, success_count: int, tool_count: int,
                                       implicit_issue_count: int, efficiency_score: float) -> float:
        """Enhanced path scoring including implicit issues"""
        if not confidences:
            return 0.0

        # Base score from average confidence
        base_score = sum(confidences) / len(confidences)

        # Enhanced penalties and bonuses
        mistake_penalty = mistake_count * 0.2
        backtrack_penalty = backtrack_count * 0.15
        implicit_penalty = implicit_issue_count * 0.1  # New penalty for implicit issues
        success_bonus = success_count * 0.1
        tool_efficiency = min(tool_count * 0.05, 0.2)
        efficiency_bonus = efficiency_score * 0.2  # New efficiency bonus

        # Length efficiency
        length_efficiency = max(0, 1 - (len(confidences) - 3) * 0.02)

        final_score = (base_score + success_bonus + tool_efficiency +
                       length_efficiency + efficiency_bonus) - \
                      (mistake_penalty + backtrack_penalty + implicit_penalty)

        return max(0.0, min(1.0, final_score))

    def generate_comprehensive_critique(self, paths: List[ReasoningPath]) -> Dict[str, any]:
        """Generate comprehensive critique and improvement suggestions"""
        if not paths:
            return {"error": "No paths found to analyze"}

        # Sort paths by quality score
        sorted_paths = sorted(paths, key=lambda p: p.overall_score, reverse=True)

        # Analyze common issues across all paths
        all_implicit_issues = []
        low_scoring_paths = [p for p in paths if p.overall_score < 0.6]

        for path in low_scoring_paths:
            all_implicit_issues.extend(path.implicit_issues)

        common_issues = Counter(all_implicit_issues).most_common(5)

        # Generate overall recommendations using AI
        if low_scoring_paths:
            sample_issues = "\n".join([
                f"Session {path.session_id}: {', '.join(path.implicit_issues)}"
                for path in low_scoring_paths[:3]
            ])

            overall_critique_prompt = f"""
            Based on analysis of multiple reasoning sessions, here are the common issues found:

            COMMON ISSUES:
            {dict(common_issues)}

            SAMPLE PROBLEM SESSIONS:
            {sample_issues}

            Please provide:
            1. **TOP 3 SYSTEMIC ISSUES** that appear across multiple sessions
            2. **ACTIONABLE ADVICE** - concrete steps to improve reasoning
            3. **MEMORY PROMPT** - a short instruction to remember for future reasoning

            Format your response clearly and concisely.
            """

            try:
                overall_critique = self.mistake_detector.model.generate_content(overall_critique_prompt)
                ai_overall_critique = overall_critique.text.strip()
            except:
                ai_overall_critique = "Could not generate overall critique"
        else:
            ai_overall_critique = "No significant issues found across reasoning sessions"

        return {
            'total_paths_analyzed': len(paths),
            'paths_with_issues': len(low_scoring_paths),
            'common_implicit_issues': dict(common_issues),
            'best_path_score': sorted_paths[0].overall_score if sorted_paths else 0,
            'worst_path_score': sorted_paths[-1].overall_score if sorted_paths else 0,
            'average_score': sum(p.overall_score for p in paths) / len(paths),
            'overall_critique': ai_overall_critique,
            'individual_critiques': {
                path.session_id: path.critique
                for path in sorted_paths[-3:] if path.critique  # Show worst 3
            }
        }

    def suggest_optimal_path(self, target_domain: str = None,
                             target_tools: List[str] = None) -> Optional[PathOptimization]:
        """Enhanced path optimization with AI critique"""
        paths = self.extract_reasoning_paths()

        if not paths:
            return None

        # Filter paths by criteria if specified
        filtered_paths = paths
        if target_domain:
            filtered_paths = [p for p in filtered_paths
                              if target_domain.lower() in str(p).lower()]
        if target_tools:
            filtered_paths = [p for p in filtered_paths
                              if any(tool in p.tool_usage for tool in target_tools)]

        if not filtered_paths:
            return None

        # Find the best path
        best_path = max(filtered_paths, key=lambda p: p.overall_score)

        # Enhanced improvement suggestions
        improvements = []
        if best_path.mistake_count > 0:
            improvements.append(f"Eliminate {best_path.mistake_count} explicit reasoning mistakes")

        if best_path.implicit_issues:
            issue_descriptions = {
                'overthinking': 'Avoid excessive consideration of alternatives',
                'circular_reasoning': 'Prevent reasoning loops and redundant validation',
                'analysis_paralysis': 'Make decisions more directly without over-analysis'
            }
            for issue in best_path.implicit_issues:
                if issue in issue_descriptions:
                    improvements.append(issue_descriptions[issue])

        # Generate specific AI critique for optimization
        optimization_critique = None
        if best_path.overall_score < 0.8:  # Only critique if there's room for improvement
            try:
                optimization_prompt = f"""
                This reasoning path scored {best_path.overall_score:.2f}/1.0. 
                Issues found: {best_path.implicit_issues}

                Provide a concise improvement strategy:
                FOCUS_ON: [Main area to improve]
                NEXT_TIME: [Specific instruction for similar situations]
                """

                response = self.mistake_detector.model.generate_content(optimization_prompt)
                optimization_critique = response.text.strip()
            except:
                optimization_critique = "Focus on more direct reasoning with fewer conditional considerations"

        reasoning_explanation = self._explain_path_quality_enhanced(best_path, paths)

        return PathOptimization(
            original_path=best_path,
            suggested_improvements=improvements,
            alternative_path=best_path if best_path.overall_score >= 0.6 else None,
            confidence_in_suggestion=min(best_path.overall_score, 0.9),
            reasoning=reasoning_explanation,
            ai_critique=optimization_critique
        )

    def _explain_path_quality_enhanced(self, path: ReasoningPath, all_paths: List[ReasoningPath]) -> str:
        """Enhanced explanation of path quality"""
        explanations = []

        avg_score = sum(p.overall_score for p in all_paths) / len(all_paths)
        if path.overall_score > avg_score:
            explanations.append(f"Score {path.overall_score:.2f} above average ({avg_score:.2f})")

        if path.mistake_count == 0:
            explanations.append("No explicit reasoning mistakes")

        if not path.implicit_issues:
            explanations.append("No implicit reasoning issues detected")
        else:
            explanations.append(f"Contains implicit issues: {', '.join(path.implicit_issues)}")

        if path.success_indicators:
            explanations.append(f"{len(path.success_indicators)} success indicators")

        avg_confidence = sum(path.confidence_scores) / len(path.confidence_scores)
        if avg_confidence > 0.7:
            explanations.append(f"High confidence ({avg_confidence:.2f})")

        return "; ".join(explanations)

    def _get_session_tools(self, session_id: str) -> List[str]:
        """Get tools used in a session"""
        with self.driver.session() as session:
            result = session.run("""
                MATCH (s:Session {id: $session_id})-[:CONTAINS]->(t:Thought)-[:USES_TOOL]->(tool:Tool)
                RETURN collect(DISTINCT tool.name) as tools
            """, session_id=session_id)

            record = result.single()
            return record['tools'] if record else []

    def close(self):
        """Close database connection"""
        self.driver.close()


def create_knowledge_graph(session_id=None):
    """Create an interactive knowledge graph visualization using Plotly"""
    # Create a NetworkX graph
    G = nx.Graph()
    
    # Get session data
    sessions = st.session_state.kg_system.get_session_info(session_id)
    
    # Add nodes and edges
    for session in sessions:
        # Add session node
        G.add_node(session['session_id'], 
                  node_type='session',
                  label=f"Session: {session['session_id']}")

        # Get thoughts for this session
        thoughts = session.get('thoughts', [])
        if isinstance(thoughts, str):
            thoughts = [thoughts]  # Convert single thought to list
        
        for i, thought in enumerate(thoughts):
            thought_id = f"{session['session_id']}_thought_{i}"
            # Add thought node
            thought_content = thought if isinstance(thought, str) else thought.get('content', str(thought))
            G.add_node(thought_id,
                      node_type='thought',
                      label=thought_content[:50] + "..." if len(thought_content) > 50 else thought_content,
                      full_content=thought_content)
            
            # Connect thought to session
            G.add_edge(session['session_id'], thought_id)
            
            # Add relationships between thoughts
            if i > 0:
                prev_thought_id = f"{session['session_id']}_thought_{i-1}"
                G.add_edge(prev_thought_id, thought_id)
    
    # Create Plotly figure
    pos = nx.spring_layout(G)
    
    # Create edge trace
    edge_x = []
    edge_y = []
    for edge in G.edges():
        x0, y0 = pos[edge[0]]
        x1, y1 = pos[edge[1]]
        edge_x.extend([x0, x1, None])
        edge_y.extend([y0, y1, None])
    
    edge_trace = go.Scatter(
        x=edge_x, y=edge_y,
        line=dict(width=0.5, color='#888'),
        hoverinfo='none',
        mode='lines')
    
    # Create node traces
    node_traces = {}
    for node_type in ['session', 'thought']:
        node_x = []
        node_y = []
        node_text = []
        node_color = '#4A90E2' if node_type == 'session' else '#357ABD'
        
        for node in G.nodes():
            if G.nodes[node]['node_type'] == node_type:
                x, y = pos[node]
                node_x.append(x)
                node_y.append(y)
                node_text.append(G.nodes[node]['label'])
        
        node_traces[node_type] = go.Scatter(
            x=node_x, y=node_y,
            mode='markers+text',
            hoverinfo='text',
            text=node_text,
            textposition="top center",
            marker=dict(
                showscale=False,
                color=node_color,
                size=20 if node_type == 'session' else 15,
                line_width=2))
    
    # Create figure
    fig = go.Figure(data=[edge_trace, node_traces['session'], node_traces['thought']],
                   layout=go.Layout(
                       title='Knowledge Graph Visualization',
                       titlefont_size=16,
                       showlegend=False,
                       hovermode='closest',
                       margin=dict(b=20,l=5,r=5,t=40),
                       xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                       yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                       plot_bgcolor='#1E1E1E',
                       paper_bgcolor='#1E1E1E',
                       font=dict(color='white')
                   ))
    
    return fig

def display_analysis(session_id):
    """Display analysis information for a session"""
    patterns = st.session_state.kg_system.analyze_patterns()
    
    with st.expander("Analysis Details", expanded=True):
        st.markdown("### Reasoning Patterns")
        st.json(patterns['reasoning_patterns'])
        
        st.markdown("### Successful Patterns")
        st.json(patterns['successful_patterns'])
        
        st.markdown("### Tool Usage Patterns")
        st.json(patterns['tool_usage_patterns'])

def process_message(message: str):
    """Process a new message and update the knowledge graph"""
    # Add user message
    st.session_state.messages.append({
        "role": "user",
        "content": message
    })
    
    # Process thinking with KG system
    session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    st.session_state.kg_system.process_thinking(message, session_id)
    st.session_state.last_session_id = session_id
    
    # Add assistant response
    st.session_state.messages.append({
        "role": "assistant",
        "content": "I've analyzed your input and updated the knowledge graph."
    })

def main():
    st.title("Agent Reasoning Analyzer")
    
    # Create two columns
    col1, col2 = st.columns([1, 2])
    
    with col1:
        st.markdown("### Chat Interface")
        
        # Display chat messages
        for message in st.session_state.messages:
            with st.container():
                st.markdown(f"""
                <div class="chat-message {message['role']}">
                    <div class="content">
                        <strong>{message['role'].title()}:</strong>
                        <p>{message['content']}</p>
                    </div>
                </div>
                """, unsafe_allow_html=True)
        
        # Chat input
        user_input = st.text_input("Your message:", key="user_input")
        if st.button("Send"):
            if user_input:
                process_message(user_input)
                st.experimental_rerun()
        
        # Analysis section
        st.markdown("### Analysis Output")
        if st.session_state.last_session_id:
            display_analysis(st.session_state.last_session_id)
    
    with col2:
        st.markdown("### Knowledge Graph Visualization")
        if st.session_state.last_session_id:
            fig = create_knowledge_graph(st.session_state.last_session_id)
            st.plotly_chart(fig, use_container_width=True)

if __name__ == "__main__":
    main()