import { Component, OnInit, signal, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { bootstrapApplication } from '@angular/platform-browser';
import { GlobalOperation, Operation, operationFunction } from './operations';
import { fromEvent, map, bufferCount, filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
board = [
    1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5, 20,
  ];
  operations = Array(20)
    .fill(0)
    .map(() => Array(4).fill(null));

  score: number = 0;
  mistakes: number = 0;
  bullsEye: GlobalOperation | undefined = undefined;
  debug = false;
  result = 1;

  pullA: Operation[] = [];
  pull: Operation[] = [];
  bullEyePull: Operation[] = [];
  requiredOperation: Operation = Operation.ADDITION;
  thirdOperationsEnabled = false;
  thirdOperationRequired = false;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.randomize();
  }

  reset(): void {
    this.operations = this.operations.map(() => [null, null, null, null]);
  }

  addOperation(op: Operation, number: number, circleIndex: number): void {
    this.operations[number - 1][circleIndex - 1] = op;
  }

  onClick(n: number): void {
    if (n === this.result) {
      this.score++;
    } else {
      this.mistakes++;
      this.el.nativeElement
        .querySelector('.animation-container')
        .classList.add('animation');
      setTimeout(
        () =>
          this.el.nativeElement
            .querySelector('.animation-container')
            .classList.remove('animation'),
        300
      );
    }

    if (this.mistakes === 3) {
      this.score = 0;
      this.mistakes = 0;
    }
    this.randomize();
  }

  randomInt(max: number): number {
    return Math.floor(Math.random() * max);
  }

  randomize(): void {
    this.updatePulls();
    this.chooseRequiredOperation();
    let attempts = 0;
    let success;
    let a, b, c, d, res;
    let opA, opB, opC, opD, bullsEyeOp;

    while (attempts < 1000 && !success) {
      attempts++;
      const requiredOperationIndex = this.randomInt(3) + 1;
      opA = this.pullA[this.randomInt(this.pullA.length)];
      opB =
        requiredOperationIndex === 1
          ? this.requiredOperation
          : this.pull[this.randomInt(this.pull.length)];
      opC =
        requiredOperationIndex === 2
          ? this.requiredOperation
          : this.pull[this.randomInt(this.pull.length)];
      opD =
        requiredOperationIndex === 3
          ? this.requiredOperation
          : this.pull[this.randomInt(this.pull.length)];

      bullsEyeOp = !this.bullEyePull.length
        ? null
        : this.bullEyePull[this.randomInt(this.bullEyePull.length)];

      let atLeastOne = false;
      if (this.thirdOperationsEnabled) {
        if (this.randomInt(2) === 0) {
          opA = this.toThirdOperation(opA);
          atLeastOne = true;
        }
        if (this.randomInt(2) === 0) {
          opB = this.toThirdOperation(opB);
          atLeastOne = true;
        }
        if (this.randomInt(2) === 0) {
          opC = this.toThirdOperation(opC);
          atLeastOne = true;
        }
        if (
          (this.requiredOperation && !atLeastOne) ||
          this.randomInt(2) === 0
        ) {
          opD = this.toThirdOperation(opD);
        }
      }

      a = this.randomInt(20) + 1;
      b = this.randomInt(20) + 1;
      c = this.randomInt(20) + 1;
      d = this.randomInt(20) + 1;

      res = 0;
      res = operationFunction(opA)(res, a);
      if (
        bullsEyeOp != null &&
        this.operationColorMatch(opA, this.requiredOperation)
      ) {
        if (this.restricRound(bullsEyeOp, res)) {
          continue;
        }
        res = operationFunction(bullsEyeOp)(res, 0);
      }

      res = operationFunction(opB)(res, b);
      if (
        bullsEyeOp != null &&
        this.operationColorMatch(opB, this.requiredOperation)
      ) {
        if (this.restricRound(bullsEyeOp, res)) {
          continue;
        }
        res = operationFunction(bullsEyeOp)(res, 0);
      }

      res = operationFunction(opC)(res, c);
      if (
        bullsEyeOp != null &&
        this.operationColorMatch(opC, this.requiredOperation)
      ) {
        if (this.restricRound(bullsEyeOp, res)) {
          continue;
        }
        res = operationFunction(bullsEyeOp)(res, 0);
      }

      res = operationFunction(opD)(res, d);
      if (
        bullsEyeOp != null &&
        this.operationColorMatch(opD, this.requiredOperation)
      ) {
        if (this.restricRound(bullsEyeOp, res)) {
          continue;
        }
        res = operationFunction(bullsEyeOp)(res, 0);
      }

      if (Math.floor(res) === res && res > 0 && res <= 20) {
        success = true;
      }
    }

    if (success) {
      this.reset();
      if (opA && opB && opC && opD && a && b && c && d) {
        this.addOperation(opA, a, 1);
        this.addOperation(opB, b, 2);
        this.addOperation(opC, c, 3);
        this.addOperation(opD, d, 4);
      }

      if (bullsEyeOp) {
        this.bullsEye = {
          operation: bullsEyeOp,
          applyTo: this.requiredOperation,
        };
      } else {
        this.bullsEye = undefined;
      }

      this.result = res || 0;
    }
  }

  restricRound(op: Operation, res: number): boolean {
    if (Operation.TEN_ROUNDED === op) {
      return res < 10;
    }
    if (Operation.HUNDRED_ROUNDED === op) {
      return res < 100;
    }
    return false;
  }

  operationColorMatch(opA: Operation, opB: Operation): boolean {
    if (opA === Operation.ADDITION || opA === Operation.THIRD_ADDITION) {
      return opB === Operation.ADDITION || opB === Operation.THIRD_ADDITION;
    }
    if (
      opA === Operation.SUBSTRACTION ||
      opA === Operation.THIRD_SUBSTRACTION
    ) {
      return (
        opB === Operation.SUBSTRACTION || opB === Operation.THIRD_SUBSTRACTION
      );
    }
    if (
      opA === Operation.MULTIPLICATION ||
      opA === Operation.THIRD_MULTIPLICATION
    ) {
      return (
        opB === Operation.MULTIPLICATION ||
        opB === Operation.THIRD_MULTIPLICATION
      );
    }
    if (opA === Operation.DIVISION || opA === Operation.THIRD_DIVISION) {
      return opB === Operation.DIVISION || opB === Operation.THIRD_DIVISION;
    }
    return false;
  }

  toThirdOperation(op: Operation): Operation {
    switch (op) {
      case Operation.ADDITION:
        return Operation.THIRD_ADDITION;
      case Operation.SUBSTRACTION:
        return Operation.THIRD_SUBSTRACTION;
      case Operation.MULTIPLICATION:
        return Operation.THIRD_MULTIPLICATION;
      case Operation.DIVISION:
        return Operation.THIRD_DIVISION;
    }
    return op;
  }

  updatePulls(): void {
    switch (this.score) {
      case 0:
        this.pullA = [Operation.ADDITION];
        this.pull = [Operation.ADDITION];
        this.bullEyePull = [];
        this.thirdOperationsEnabled = false;
        break;
      case 10:
        this.pullA.push(Operation.SUBSTRACTION);
        this.pull.push(Operation.SUBSTRACTION);
        break;
      case 20:
        this.pull.push(Operation.MULTIPLICATION);
        break;
      case 30:
        this.pull.push(Operation.DIVISION);
        break;
      case 40:
        this.bullEyePull = [Operation.SQUARE];
        break;
      case 50:
        this.bullEyePull = [Operation.REVERSE];
        break;
      case 60:
        this.bullEyePull = [Operation.ROUNDED];
        break;
      case 70:
        this.bullEyePull = [
          Operation.SQUARE,
          Operation.REVERSE,
          Operation.ROUNDED,
        ];
        this.thirdOperationsEnabled = true;
        this.thirdOperationRequired = true;
        break;
      case 80:
        this.bullEyePull = [Operation.TEN_ROUNDED, Operation.HUNDRED_ROUNDED];
        this.thirdOperationRequired = false;
        break;
      case 90:
        this.bullEyePull = [
          Operation.SQUARE,
          Operation.REVERSE,
          Operation.ROUNDED,
          Operation.TEN_ROUNDED,
          Operation.HUNDRED_ROUNDED,
        ];
        break;
    }
  }

  chooseRequiredOperation(): void {
    const random = [
      Operation.ADDITION,
      Operation.SUBSTRACTION,
      Operation.MULTIPLICATION,
      Operation.DIVISION,
    ];

    switch ((this.score - (this.score % 10)) / 10) {
      case 0:
        this.requiredOperation = Operation.ADDITION;
        break;
      case 1:
        this.requiredOperation = Operation.SUBSTRACTION;
        break;
      case 2:
        this.requiredOperation = Operation.MULTIPLICATION;
        break;
      case 3:
        this.requiredOperation = Operation.DIVISION;
        break;
      default:
        this.requiredOperation = random[this.randomInt(4)];
        break;
    }
  }
}
