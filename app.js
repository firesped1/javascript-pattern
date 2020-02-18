dd = console.log.bind(console);

// createElementNS = SVG 태그 생성용
svgElem = tag => document.createElementNS('http://www.w3.org/2000/svg', tag);

// history = 그리는 거 / 방금전까지 그렷던 거
// down = 마우스 클릭 여부
// before = 패턴 한번더 저장용

const App = {
    history: [],
    down: false,
    before: [],

    // 초기 구동용

    init() {
        // 이벤트 바인딩
        this.bind();
        // 기본 그리기용
        this.arrange(3,3);
    },

    // 이벤트 바인딩
    bind() {
        $(document)
            .on("mousedown", "#pattern circle", this.startDrawing.bind(this))
            .on("mousemove", "#pattern", this.drawLine.bind(this))
            .on("mouseenter", "#pattern circle", this.addPoint.bind(this))
            .on("mouseup", "#pattern", this.finishDraw.bind(this))
    },

    // 패턴 배열하기
    arrange(w, h) {
        // 기존에 있던 원 제거 (Path는 제거 안함)
        $("#pattern circle").each((ix,el) => $(el).remove());

        // 캔버스 넓이 / (가로/세로) 점의 갯수
        const blockX = 450 / w;
        const blockY = 450 / h;

        // 위의 블록에서 절반 빼기 (transformX(-50%)랑 동일)
        const centerX = blockX / 2;
        const centerY = blockY / 2; 

        // 배열하기 y = 세로 x = 가로
        for (let y = 1; y <= h; y++) {
            for (let x = 1; x <= w; x++) {
                // blockX * x - centerX - 7.5
                // 한 칸의 넓이 * 현재 칸의 위치 - 칸의 넓이의 반 - 원의 넓이의 반
                // Y도 마찬가지

                const circle = $(svgElem('circle'));
                circle.attr({
                    fill: '#333',
                    r: 7.5,
                    cx: blockX * x - centerX - 7.5,
                    cy: blockY * y - centerY - 7.5
                });

                circle.appendTo('#pattern');
            }
        }
    },

    // 패턴 그리기 시작하기
    startDrawing(e) {
        // circle, path 초기 상태로
        $("circle").attr("fill", "#333").removeClass('active');
        $("path").attr('stroke', 'skyblue')

        // 시작할 때 집은 점
        const point = $(e.target);

        // 클릭했다는 표시 + history에 추가
        point.attr("fill", "skyblue");
        point.addClass('active');
        this.history = [point.index()];

        // 마우스 누름 변경
        this.down = true;        
    },

    // 지금까지 그려온 패턴 출력하기
    lineHistory() {
        return this.history.reduce((acc,val,idx) => {
            // 패턴의 원에서 좌표값 가져온다
            const {cx,cy} = $("#pattern *").get(val).attributes;

            // jQuery 방식
            // const cx = $("#pattern *").eq(val).attr('cx')
            // const cy = $("#pattern *").eq(val).attr('cy')

            // idx = 0일 시 시작점으로 이동, 아닐 시 그 점으로 선을 그린다
            return acc + (idx ? ` L${cx.value} ${cy.value}` : `M${cx.value} ${cy.value}`);
        }, '');
    },

    // 점과 점 사이의 점 구하기 (시작점, 끝점)
    getPassingPoints(start, end) {
        // 사이에 있는 점 filter해서 반환함
        return $("circle").toArray().filter(point => {
            // 현재 선택된 점의 좌표값
            const pointCoord = [point.attributes.cx.value * 1, point.attributes.cy.value * 1];
            // 시작점, 끝점 예외 추가
            if((pointCoord[0] === start[0] && pointCoord[1] === start[1]) || (pointCoord[0] === end[0] && pointCoord[1] === end[1])) return false;

            // 시작점에서 중간점의 거리 + 끝점에서 중간점의 거리 === 시작점에서 끝점의 거리 일 시 return true
            return (this.getDistance(start, pointCoord) + this.getDistance(end, pointCoord) === this.getDistance(start, end));
        });
    },

    getDistance(a, b) {
        // 피타고라스의 정리를 이용해 대각선의 길이를 가져옴
        // 빗변의 제곱이 두 직각변의 제곱의 합과 같다
        return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
    },

    // 선 그리기
    drawLine(e) {
        // 마우스를 누르고 있지 않으면 return false
        if(!this.down) return false;

        // 지금까지 그려온 패턴 => this.lineHistory에서 가져옴
        const path = this.lineHistory();
        // 현재 커서의 위치
        const nowPos = [e.offsetX, e.offsetY];

        // 지금까지 그려온 패턴 + 현재 커서의 위치로 선을 그린다
        $("#pattern path").attr("d", path + ` L${nowPos[0]} ${nowPos[1]}`);
    },

    addPoint(e) {
        // 마우스 안누르면 return false
        if(!this.down) return false;

        // 방금 닿은 점 (event.target)
        const now = $(e.target);
        // 이전 점
        const before = $('#pattern *').eq(this.history.slice(-1));

        // 방금 닿은 점의 index
        const index = now.index();
        // skyblue로 fill 변경, active 클래스 추가
        now.attr("fill", "skyblue").addClass('active');

        //사이에 있는 점 찾기
        const between = this.getPassingPoints(
            // [이전 점 좌표값]
            // [방금 닿은 점 좌표값]
            [before.attr('cx') * 1, before.attr('cy') * 1],
            [now.attr('cx') * 1, now.attr('cy') * 1]
        ).map(x => {
            // 사이에 있는 점들에 색깔, active class 추가
            // index 반환
            x.classList.add('active');
            return $(x).attr('fill', 'skyblue').index();
        })

        // 전에 입력했던 점과 같은 점일 시 return false
        if(!this.history.find(x => x === index)){
            // 사이의 점과 지금 선택한 점 history에 push
            this.history.push(...between, index);
        }

        return false;
    },

    finishDraw(e) {
        // 캔버스 mouseup때 발동 => 캔버스 클릭 시 발동 방지 
        if(!this.history.length) return false;

        this.down = false;

        // 현재까지 그려온 패턴 그림
        const path = this.lineHistory();

        // 패턴 그림
        $("#pattern path").attr("d", path);

        // 점이 4개 이하로 연결되었을 시 return false
        if(this.history.length < 4) {
            this.printError('4개 이상의 점을 이어야 합니다.');
            return false;
        }

        // 전에 입력했던 패턴과 지금 입력한 패턴 비교용;
        const before = JSON.stringify(this.before);
        const now = JSON.stringify(this.history);

        // 기존에 입력했던 패턴이 있고, 전의 패턴과 지금의 패턴이 같을 시
        if(this.before.length && before === now) {
            this.printValid('패턴 입력이 완료되었습니다.');
            $('#pattern circle').css('pointer-events', 'none');
        }
        // 기존에 입력했던 패턴이 있고, 패턴이 전과 일치하지 않을 시
        else if(this.before.length && before !== now) {
            this.printError('이전 패턴과 맞지 않습니다.')
        }
        // 기존에 입력했던 패턴이 없을 시
        else{
            // before로 history deep copy
            this.before = this.history.slice(0);
            this.printValid('확인을 위해 다시 한 번 입력해 주세요.');
        }

    },

    // 오류메세지 출력
    printError(msg) {
        $("circle.active").attr('fill', '#d62527');
        $("path").attr('stroke', '#d62527');
        $('p').text(msg);

        this.before = [];
    },

    // 성공메세지 출력
    printValid(msg) {
        $("circle.active").attr('fill', 'green');
        $("path").attr('stroke', 'green');
        $('p').text(msg);
    }

}

$(function() {
    App.init();
})