import sqlite3
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DATABASE = 'agendamentos.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def create_tables():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Script SQL para criar as tabelas
    create_script = """
    CREATE TABLE IF NOT EXISTS tipo_agendamento (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profissional (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS servico (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agendamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        tipo_agendamento_id INTEGER NOT NULL,
        profissional_id INTEGER NOT NULL,
        data_hora TEXT NOT NULL,
        duracao INTEGER NOT NULL,
        servico_id INTEGER NOT NULL,
        id_cliente TEXT NOT NULL,
        endereco_cliente TEXT NOT NULL,
        observacoes TEXT,
        FOREIGN KEY (tipo_agendamento_id) REFERENCES tipo_agendamento(id),
        FOREIGN KEY (profissional_id) REFERENCES profissional(id),
        FOREIGN KEY (servico_id) REFERENCES servico(id)
    );
    """
    cursor.executescript(create_script)
    
    # Inserir dados iniciais se não existirem
    cursor.execute("SELECT COUNT(*) FROM tipo_agendamento")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO tipo_agendamento (nome) VALUES ('Visita'), ('Retorno'), ('Acesso Remoto')")
    
    cursor.execute("SELECT COUNT(*) FROM profissional")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO profissional (nome) VALUES ('Hamilton Reis'), ('Márcio Hamilton')")
        
    cursor.execute("SELECT COUNT(*) FROM servico")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO servico (nome) VALUES ('Teste')")
    
    conn.commit()
    conn.close()

# Rota para a página inicial
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

# Rota para servir arquivos CSS
@app.route('/<path:filename>.css')
def serve_css(filename):
    return send_from_directory('.', filename + '.css')

# Rota para servir arquivos JS
@app.route('/<path:filename>.js')
def serve_js(filename):
    return send_from_directory('.', filename + '.js')


# Rota para agendar um novo atendimento
@app.route('/agendar', methods=['POST'])
def agendar_atendimento():
    try:
        data = request.json
        if not data.get('data_hora') or not data.get('id_cliente') or not data.get('endereco_cliente'):
            return jsonify({'error': 'Dados incompletos'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Validação de disponibilidade
        cursor.execute("SELECT COUNT(*) FROM agendamentos WHERE data_hora = ?", (data['data_hora'],))
        if cursor.fetchone()[0] > 0:
            return jsonify({'error': 'Horário indisponível'}), 409
        
        # Inserir agendamento
        cursor.execute(
            "INSERT INTO agendamentos (timestamp, tipo_agendamento_id, profissional_id, data_hora, duracao, servico_id, id_cliente, endereco_cliente, observacoes) VALUES (datetime('now'), 1, 1, ?, 60, 1, ?, ?, ?)",
            (data['data_hora'], data['id_cliente'], data['endereco_cliente'], data.get('observacoes', ''))
        )
        conn.commit()
        conn.close()

        return jsonify({'message': 'Agendamento realizado com sucesso'}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Rota para buscar horários disponíveis
@app.route('/slots', methods=['GET'])
def get_available_slots():
    # Retorna uma lista de horários disponíveis (exemplo estático)
    return jsonify({
        'slots': [
            '2025-08-15T10:00:00',
            '2025-08-15T14:00:00',
            '2025-08-16T10:00:00',
            '2025-08-18T09:00:00',
            '2025-08-18T11:00:00'
        ]
    })

if __name__ == '__main__':
    create_tables()
    app.run(debug=True)