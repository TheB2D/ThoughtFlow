# Agent Reasoning Analyzer

A sophisticated system for analyzing and visualizing agent reasoning processes using knowledge graphs and AI-powered analysis.

## Features

- Real-time reasoning analysis and visualization
- Knowledge graph construction and querying
- AI-powered critique and improvement suggestions
- Pattern recognition in reasoning strategies
- Interactive visualization of reasoning paths
- Mistake detection and optimization suggestions

## Prerequisites

- Python 3.8+
- Neo4j Database
- Google Gemini API access
- Friendli API access

## Environment Variables

Create a `.env` file in the project root with the following variables:

```
# API Keys
GEMINI_API_KEY=your_gemini_api_key_here
FRIENDLI_API_TOKEN=your_friendli_api_token_here

# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password_here
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <repository-name>
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up Neo4j:
- Install Neo4j Desktop or use Neo4j Aura
- Create a new database
- Update the `.env` file with your Neo4j credentials

## Usage

1. Start the Streamlit application:
```bash
streamlit run analyzer.py
```

2. Open your browser and navigate to `http://localhost:8501`

3. Use the chat interface to input reasoning processes for analysis

## Project Structure

- `analyzer.py`: Main Streamlit application and visualization
- `main.py`: Core reasoning analysis and knowledge graph functionality
- `agents/deepseek.py`: Integration with Friendli API
- `test_neo4j.py`: Neo4j connection testing

## Features in Detail

### Reasoning Analysis
- Extracts structured information from reasoning processes
- Identifies patterns and relationships between thoughts
- Detects both explicit and implicit reasoning mistakes
- Provides AI-powered critique and improvement suggestions

### Knowledge Graph
- Stores reasoning processes in a Neo4j graph database
- Enables querying of reasoning patterns
- Visualizes relationships between thoughts and decisions
- Tracks tool usage and success indicators

### Visualization
- Interactive knowledge graph visualization
- Real-time analysis updates
- Pattern recognition and display
- Tool usage tracking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Gemini API for AI analysis
- Friendli API for enhanced reasoning capabilities
- Neo4j for graph database functionality
- Streamlit for the web interface 