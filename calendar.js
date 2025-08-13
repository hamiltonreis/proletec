document.addEventListener('DOMContentLoaded', function() {
    const scheduleButton = document.getElementById('scheduleButton');
    const modal = document.getElementById('scheduleModal');
    const closeButton = document.querySelector('.close-button');
    const calendarContainer = document.getElementById('calendar-container');
    const scheduleForm = document.getElementById('scheduleForm');
    const appointmentForm = document.getElementById('appointmentForm');

    let currentMonth = new Date();
    let selectedDate = null;
    let availableSlots = [];

    // URL do backend
    const API_URL = 'http://localhost:5000';

    scheduleButton.addEventListener('click', function(event) {
        event.preventDefault(); // Impede a navegação do link
        modal.style.display = 'block';
        fetchAvailableSlots(currentMonth);
    });

    closeButton.addEventListener('click', function() {
        modal.style.display = 'none';
        scheduleForm.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
            scheduleForm.style.display = 'none';
        }
    });

    async function fetchAvailableSlots(date) {
        try {
            const response = await fetch(`${API_URL}/slots`);
            const data = await response.json();
            availableSlots = data.slots;
            renderCalendar(date);
        } catch (error) {
            console.error('Erro ao buscar slots disponíveis:', error);
            alert('Não foi possível carregar os horários. Tente novamente mais tarde.');
        }
    }

    function renderCalendar(date) {
        calendarContainer.innerHTML = '';
        const monthYear = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const calendarHeader = document.createElement('div');
        calendarHeader.className = 'calendar-header';
        calendarHeader.innerHTML = `
            <button onclick="prevMonth()">&lt;</button>
            <h3>${monthYear}</h3>
            <button onclick="nextMonth()">&gt;</button>
        `;
        calendarContainer.appendChild(calendarHeader);

        const calendarGrid = document.createElement('div');
        calendarGrid.className = 'calendar-grid';
        calendarContainer.appendChild(calendarGrid);

        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        dayNames.forEach(dayName => {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day day-name';
            dayDiv.textContent = dayName;
            calendarGrid.appendChild(dayDiv);
        });

        for (let i = 0; i < firstDayOfMonth.getDay(); i++) {
            const emptyDiv = document.createElement('div');
            calendarGrid.appendChild(emptyDiv);
        }

        for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
            const dayDiv = document.createElement('div');
            const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
            const isAvailable = availableSlots.some(slot => new Date(slot).toDateString() === currentDate.toDateString());

            dayDiv.textContent = day;
            dayDiv.className = 'calendar-day';
            
            if (isAvailable) {
                dayDiv.classList.add('available');
                dayDiv.addEventListener('click', () => showAvailableTimes(currentDate));
            } else {
                dayDiv.classList.add('unavailable');
            }
            calendarGrid.appendChild(dayDiv);
        }
    }

    function showAvailableTimes(date) {
        document.querySelectorAll('.calendar-day.selected').forEach(el => el.classList.remove('selected'));
        const dayDiv = document.querySelector(`.calendar-day:not(.day-name):nth-child(${date.getDate() + firstDayOfMonth.getDay() + 7})`);
        if (dayDiv) {
            dayDiv.classList.add('selected');
        }

        const availableTimes = availableSlots
            .filter(slot => new Date(slot).toDateString() === date.toDateString())
            .map(slot => new Date(slot).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

        let timesHtml = '<h4>Horários Disponíveis</h4>';
        timesHtml += '<ul class="time-slots-list">';
        availableTimes.forEach(time => {
            timesHtml += `<li class="time-slot" data-time="${time}">${time}</li>`;
        });
        timesHtml += '</ul>';

        calendarContainer.innerHTML = timesHtml;
        
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.addEventListener('click', function() {
                const selectedTime = this.getAttribute('data-time');
                const [hour, minute] = selectedTime.split(':');
                selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute);
                
                document.getElementById('selectedDateTime').textContent = selectedDate.toLocaleString('pt-BR');
                scheduleForm.style.display = 'block';
            });
        });
    }

    window.prevMonth = function() {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        fetchAvailableSlots(currentMonth);
    }

    window.nextMonth = function() {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        fetchAvailableSlots(currentMonth);
    }

    appointmentForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const data = {
            data_hora: selectedDate.toISOString(),
            id_cliente: document.getElementById('document').value,
            endereco_cliente: document.getElementById('address').value,
            observacoes: document.getElementById('notes').value
        };

        try {
            const response = await fetch(`${API_URL}/agendar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (response.ok) {
                alert('Agendamento realizado com sucesso!');
                modal.style.display = 'none';
            } else {
                alert('Erro ao agendar: ' + (result.error || response.statusText));
            }
        } catch (error) {
            console.error('Erro de rede:', error);
            alert('Erro de conexão com o servidor. Tente novamente mais tarde.');
        }
    });
});