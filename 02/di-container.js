const DiContainer = function() {
  // 반드시 생성사로 객체를 생성하게 한다.
  if (!(this instanceof DiContainer)) {
    return new DiContainer();
  }

  this.registrations = [];
};

DiContainer.prototype.message = {
  registerRequiresArgs:
    "이 생성자 함수는 인자가 3개 있어야 합니다.:" + "문자열, 문자열 배열, 함수"
};

DiContainer.prototype.register = function(name, dependencies, func) {
  let ix;

  if (
    typeof name !== "string" ||
    !Array.isArray(dependencies) ||
    typeof func !== "function"
  ) {
    throw new Error(this.message.registerRequiresArgs);
  }

  for (ix = 0; ix < dependencies.length; ++ix) {
    if (typeof dependencies[ix] !== "string") {
      throw new Error(this.message.registerRequiresArgs);
    }
  }

  this.registrations[name] = { dependencies, func };
  console.log(this.registrations);
};

DiContainer.prototype.get = function(name) {
  const self = this;
  const registration = this.registrations[name];
  const dependencies = [];

  if (registration === undefined) return undefined;

  registration.dependencies.forEach(dependencyName => {
    
    const dep = self.get(dependencyName);
    dependencies.push(dep);
  });

  return registration.func.apply(null, dependencies);
};


// test

describe("DiContainer", () => {
  let container;

  beforeEach(() => {
    container = new DiContainer();
  });

  describe("register(name,dependencies, func", () => {
    it("인자가 하나라도 빠졌거나 타입이 잘못되면 예외를 던진다.", () => {
      const badArgs = [
        // 인자가 아예 없는 경우
        [],
        // name만 있는 경우
        ["Name"],
        // name, dep만 있는 경우
        ["Name", ["Dependency1", "Dependency2"]],
        // dep가 빠진 경우
        ["Name", function () {
        }],
        // 타입이 잘못된 다양한 사례들
        [1, ["a", "b"], () => {
        }],
        ["Name", [1, 2], () => {
        }],
        ["Name", ["a", "b"], "should be function"]
      ];
      badArgs.forEach(args => {
        expect(() => container.register(args)).toThrow();
      });
    });
  });

  describe('get(name)', () => {
    it('성명이 등록되어 있지 않으면 undefined를 반환한다.', () => {
      expect(container.get('notDefined')).toBeUndefined();
    })

    it('등록된 함수를 실행한 결과를 반환한다.', () => {
      const name = 'MyName';
      const returnFormRegisteredFunction = 'something';
      container.register(name, [], () => returnFormRegisteredFunction);

      expect(container.get(name)).toBe(returnFormRegisteredFunction);
    });

    it('등록된 함수에 의존성을 제공한다.', () => {
      const main = 'main'
      const dep1 = 'dep1'
      const dep2 = 'dep2'
      let mainFunc;

      container.register(dep1, [], () => () => 1)
      container.register(dep2, [], () => () => 2)
      container.register(main, [dep1, dep2], (dep1Func, dep2Func) => () => dep1Func() + dep2Func())

      mainFunc = container.get(main);

      expect(mainFunc()).toBe(3);
    })

  })
});


// 의존성 활용

class ConferenceWebSvc {}
class Messenger {}
class Attendee {
  constructor(service, messenger, attendeeId) {

  }
}



const MyApp = {};

MyApp.diContainer = new DiContainer();
MyApp.diContainer.register(
  'Service', // 웹 서비스를 가리키는 DI 태그
  [],         // 의존성 없음
  () => new ConferenceWebSvc()
);
MyApp.diContainer.register(
  'Messenger',
  [],
  () => new Messenger()
);
MyApp.diContainer.register(
  'AttendeeFactory',
  ['Service', 'Messenger'],
  (service, messenger) => (attendeeId) => new Attendee(service, messenger, attendeeId)
)

// before
// const attendee = new Attendee(new ConferenceWebSvc(), new Messenger(), id);

// after di
const attendee = MyApp.diContainer.get('AttendeeFactory')(1)
